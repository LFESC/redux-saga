# effectRunnerMap
我们在 [proc](./proc.md) 这一篇里面说 effect creators 所产生的 effects 最终会在 effectRunnerMap 里面去执行，所以我们在
这篇里面讲讲 effectRunnerMap 是如何实现这些 effects 的。
>注意：由于 effect creators 实在过多，所以我会挑一些常用的 effect creators(call fork spawn put putResolve take takeMaybe...) 去讲解。
## 源码地址
`packages/core/src/internal/effectRunnerMap.js`
## 解析
我们可以看到 effectRunnerMap 这个文件最终返回的就是一个对象，这个对象的 key 就是 effect types 值就是每个 effect 对应的 runner，这个应该很好理解。
```js
const effectRunnerMap = {
  [effectTypes.TAKE]: runTakeEffect,
  [effectTypes.PUT]: runPutEffect,
  [effectTypes.ALL]: runAllEffect,
  [effectTypes.RACE]: runRaceEffect,
  [effectTypes.CALL]: runCallEffect,
  [effectTypes.CPS]: runCPSEffect,
  [effectTypes.FORK]: runForkEffect,
  [effectTypes.JOIN]: runJoinEffect,
  [effectTypes.CANCEL]: runCancelEffect,
  [effectTypes.SELECT]: runSelectEffect,
  [effectTypes.ACTION_CHANNEL]: runChannelEffect,
  [effectTypes.CANCELLED]: runCancelledEffect,
  [effectTypes.FLUSH]: runFlushEffect,
  [effectTypes.GET_CONTEXT]: runGetContextEffect,
  [effectTypes.SET_CONTEXT]: runSetContextEffect,
}

export default effectRunnerMap
```
### runCallEffect
[call](https://redux-saga.js.org/docs/api/#callfn-sags) 对应的就是 runCallEffect 这个方法。
我们可以看到在源码里我们先通过 apply 执行了 fn 也就是 call 方法里面传入的 fn，然后去判断 result 的类型：
- promise: 如果 result 是 promise，则当 promise resolved/rejected 的时候执行 cb
- iterator: 如果 result 是 iterator，则递归调用 [proc](./proc.md) 方法
- 其它: 其它情况直接调用 cb
- 错误: 如果执行过程发生错误也会调用 cb
>注意：这里的 cb 就是我们在 [proc](./proc.md) 那篇里面讲的 runEffect 方法里面定义的 currCb
我在那篇里面详细说过 currCb 的作用，简单来说就是继续执行 saga(Generator) 方法，所以为什么 call 方法是阻塞的呢，就是因为它在 fn 执行完毕之后才去调用 currCb。
```js
function runCallEffect(env, { context, fn, args }, cb, { task }) {
  // catch synchronous failures; see #152
  // 捕捉同步失败；看 #152
  try {
    const result = fn.apply(context, args)

    if (is.promise(result)) {
      resolvePromise(result, cb)
      return
    }

    if (is.iterator(result)) {
      // resolve iterator
      // 解决迭代器
      proc(env, result, task.context, currentEffectId, getMetaInfo(fn), /* isRoot */ false, cb)
      return
    }

    cb(result)
  } catch (error) {
    cb(error, true)
  }
}
```
### runForkEffect
[fork](https://redux-saga.js.org/docs/api/#forkfn-args) 和 [spawn](https://redux-saga.js.org/docs/api/#spawnfn-args) 对应的都是 runForkEffect 这个方法。
1.首先会通过 createTaskIterator 创建一个 iterator 对象，具体创建过程可以去看源码，并不复杂，简单来说就是如果 fn 返回的结果是一个 iterator 那就直接返回，否则就创建一个 iterator 对象。
2.然后根据 iterator 或是 fn 创建一个 meta 对象。
3.接着调用 immediately 去执行传入的方法。
4.这个方法会调用 [proc](./proc.md) 生成一个 child 对象，这个是一个 [task](./task.md)。
5.然后去判断 detached 是否为 true，这个值是属于 runForkEffect 里面的第二个参数 payload，如果是 fork 则 detached 为 undefined，这一点可以去看 io.js，如果是 spawn 则 detached 为 true，关于 attached 和 detached 的区别我在这里就不赘述了，官方文档里面已经有说明。
6.如果是 spawn 则直接调用 cb(child) 继续执行 saga。
7.如果是 fork，则会判断 child task 的状态，并根据状态去执行 parent.queue 的一些方法，也就是父 task 会根据子 task 做一些操作，这也就体现了 fork 和 spawn 的区别，fork 的任务会附加在父任务上面，细节的地方还请看我的 [task](./task.md) 这一篇，最终如果 task 没有被终止也会调用 cb(child) 也就是调用 currCb 让 saga 继续执行下去。  
>注：
>
>queue: 关于 queue 的一些方法，比如这里用到的 addTask 和 abort 可以去看 [forkQueue](./forkQueue.md) 这一篇。
>
>createTaskIterator: 内部实现基于 makeIterator 方法，关于这个方法可以看[这篇文章](./makeIterator.md) 
```js
function runForkEffect(env, { context, fn, args, detached }, cb, { task: parent }) {
  const taskIterator = createTaskIterator({ context, fn, args })
  const meta = getIteratorMetaInfo(taskIterator, fn)

  immediately(() => {
    const child = proc(env, taskIterator, parent.context, currentEffectId, meta, detached, noop)

    if (detached) {
      cb(child)
    } else {
      if (child.isRunning()) {
        parent.queue.addTask(child)
        cb(child)
      } else if (child.isAborted()) {
        parent.queue.abort(child.error())
      } else {
        cb(child)
      }
    }
  })
  // Fork effects are non cancellables
}
```
### runPutEffect
[put](https://redux-saga.js.org/docs/api/#putaction) 和 [putResolve](https://redux-saga.js.org/docs/api/#putresoveaction) 对应的都是 runPutEffect 这个方法。
1.首先调用 asap 这个方法，这个方法在 scheduler 里面，它会将传入的方法添加到 queue 里面，具体的细节可以看 [scheduler](./scheduler.md) 这一篇。
2.在方法里面会执行 action 并将返回的结果存入 result。
3.判断 resolve 是否为 true 以及 result 是否为 promise，如果成立则表示调用的是 putResolve 否则调用的则是 put。
4.如果调用的是 putResolve 则会调用 [resolvePromise](./resolvePromise.md) 方法去执行 promise 然后再调用 cb，这也就体现了 putResolve 的作用：返回的 effect 是阻塞的，如果返回了一个 promise 只有当 promise 执行完毕才会执行接下来的代码。
```js
function runPutEffect(env, { channel, action, resolve }, cb) {
  /**
   Schedule the put in case another saga is holding a lock.
   The put will be executed atomically. ie nested puts will execute after
   this put has terminated.
   **/
  asap(() => {
    let result
    try {
      result = (channel ? channel.put : env.dispatch)(action)
    } catch (error) {
      cb(error, true)
      return
    }

    if (resolve && is.promise(result)) {
      resolvePromise(result, cb)
    } else {
      cb(result)
    }
  })
  // Put effects are non cancellables
}
```
### runTakeEffect
[take](https://redux-saga.js.org/docs/api/#takepattern) 和 [takeMaybe](https://redux-saga.js.org/docs/api/#takemaybepattern) 对应的都是 runTakeEffect 这个方法。
1.首先创建一个 takeCb 方法，它内部会调用 cb，也就是 [currCb](./proc.md) 它会调用 next 方法继续执行 saga，当然这里要注意对于 maybe 的判断，如果 !maybe 成立也就是调用 take 的情况，如果 !maybe 不成立也就是调用 takeMaybe 的情况，这两种方法会在接收到 END 这个 action 时有不同的表现，从代码上来看就是如果 !maybe 成立也就是调用的 take 方法，则执行 cb(TERMINATE) 终止 saga，如果不成立也就是 takeMaybe 则继续执行 cb。
2.take 内部其实调用的是 channel.take 方法，关于 channel.take 做了什么可以去看 [channel](./channel.md) 这篇文章。
```js
function runTakeEffect(env, { channel = env.channel, pattern, maybe }, cb) {
  const takeCb = input => {
    if (input instanceof Error) {
      cb(input, true)
      return
    }
    if (isEnd(input) && !maybe) {
      cb(TERMINATE)
      return
    }
    cb(input)
  }
  try {
    channel.take(takeCb, is.notUndef(pattern) ? matcher(pattern) : null)
  } catch (err) {
    cb(err, true)
    return
  }
  cb.cancel = takeCb.cancel
}
```
### runCancelEffect
[take](https://redux-saga.js.org/docs/api/#canceltask) 对应的就是 runCancelEffect 这个方法。
在说 runCancelEffect 方法之前先看一下 cancelSingleTask 因为其内部实现就是调用的这个方法，这个方法很简单就是调用了 task 对象自身的 cancel，所以这里我们知道了 cancel 方法内部其实就是调用了 task.cancel 关于 task 的详情可以去看[这篇文章](./task.md)
接下来说 runCancelEffect 本体，它分为几种情况：
- taskOrTasks === SELF_CANCELLATION: 默认参数就是 SELF_CANCELLATION 表示取消自身，cancelSingleTask 的参数是外层传入的 task
- is.array(taskOrTasks): 取消多个任务，循环调用 cancelSingleTask
- 其它情况: 也就是取消单个任务，就是直接调用 cancelSingleTask  

最后执行 cb 继续迭代
```js
function cancelSingleTask(taskToCancel) {
  if (taskToCancel.isRunning()) {
    taskToCancel.cancel()
  }
}

function runCancelEffect(env, taskOrTasks, cb, { task }) {
  if (taskOrTasks === SELF_CANCELLATION) {
    cancelSingleTask(task)
  } else if (is.array(taskOrTasks)) {
    taskOrTasks.forEach(cancelSingleTask)
  } else {
    cancelSingleTask(taskOrTasks)
  }
  cb()
  // cancel effects are non cancellables
}
```
### runCancelledEffect
[cancelled](https://redux-saga.js.org/docs/api/#cancelled) 对应的就是 runCancelledEffect 这个方法。
可以看到这个方法很简单就是调用了 task.isCancelled 方法，关于 task 的相关解析可以看[这篇文章](./task.md)
```js
function runCancelledEffect(env, data, cb, { task }) {
  cb(task.isCancelled())
}
```
### runRaceEffect
[race](https://redux-saga.js.org/docs/api/#raceeffects) 对应的就是 runRaceEffect 这个方法，这个方法可以分为三个部分：
1. 通过对 effects 的遍历创建一个 childCbs 对象，key 为 effects 的 key，value 为 chCbAtKey
2. 给传进来的 cb 对象的 cancel 属性赋值
3. 遍历 effects 的 keys 并对每一项调用 digestEffect 方法  

我们首先来看第三部分，digestEffect 方法的第一个参数是一个 effect，这就是你传给 race 方法的 effects 中的 effect，它的作用是处理这个 effect，具体内部的实现可以看[这篇文章](./proc.md)，第三个参数是一个 callback 回调函数，当 effect 处理完之后就会执行回调，这个回调就是我们在第一部分创建的那个回调。
接着我们去看第一部分创建的回调，它会处理三种情况：

1. completed === true: 表示 race 已经完成，则直接 return
2. isErr || shouldComplete(res): 判断 effect 执行过程中是否报错或是被终止和取消，如果符合情况调用 cb.cancel 以及 cb(res, isErr)
3. 如果第二条的判断不成立说明 effect 顺利执行完毕，这时候调用 cb.cancel，接着设置 completed = true，设置 response 并调用 cb(response)  
我们发现任何一个 effect 执行完成之后会将 completed 置为 true，这时如果后续 effect 执行成功进入 chCbAtKey 后因为 completed 为 true 都会直接 return 而不执行接下来的操作，这样也就达到了 race 的目的。
```js
function runRaceEffect(env, effects, cb, { digestEffect }) {
  const effectId = currentEffectId
  const keys = Object.keys(effects)
  const response = is.array(effects) ? createEmptyArray(keys.length) : {}
  const childCbs = {}
  let completed = false

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
       return
      }
      if (isErr || shouldComplete(res)) {
        // Race Auto cancellation
        cb.cancel()
        cb(res, isErr)
      } else {
        cb.cancel()
        completed = true
        response[key] = res
        cb(response)
      }
    }
    chCbAtKey.cancel = noop
    a[key] = chCbAtKey
  })

  cb.cancel = () => {
    // prevents unnecessary cancellation
    if (!completed) {
      completed = true
      keys.forEach(key => childCbs[key].cancel())
    }
  }
  keys.forEach(key => {
    if (completed) {
      return
    }
    digestEffect(effects[key], effectId, childCbs[key], key)
  })
}
```
### runAllEffect
[all](https://redux-saga.js.org/docs/api/#alleffects) 对应的就是 runAllEffect 这个方法，这个方法内部实现和 race 类似也有三部分：
1. 先判断传入的 effects 的 keys 是否长度为零，是则调用 cb 然后 return 说明没有需要处理的 effects
2. 同 race 第二部分通过 createAllStyleChildCallbacks 方法创建 childCallbacks
3. 同 race 第三部分，遍历 keys 调用 digestEffect 执行 effect，执行完后会调用传入的回调函数 childCallbacks
>注：digestEffect 方法是在 proc.js 里面定义的，详情可以去看[这篇文章](.proc.md)
```js
function runAllEffect(env, effects, cb, { digestEffect }) {
  const effectId = currentEffectId
  const keys = Object.keys(effects)
  if (keys.length === 0) {
    cb(is.array(effects) ? [] : {})
    return
  }

  const childCallbacks = createAllStyleChildCallbacks(effects, cb)
  keys.forEach(key => {
    digestEffect(effects[key], effectId, childCallbacks[key], key)
  })
}
```
all 方法的内部实现和 race 相似，唯一不同的就是每一个 effect 的回调函数，all 方法的回调函数是通过 createAllStyleChildCallbacks 方法创建的，我们接下来就去看看这个方法。
首先介绍一些内部变量：
- shape: effects
- parentCallback: 父任务的回调函数
- totalCount: effects 的总数
- completedCount: effect 完成的数量
- completed: 所有 effect 方法是否完成的标志
- results: 所有 effect 执行的结果
- childCallbacks: 最终返回的所有 effect 的回调函数对象
变量分析完了我们就可以去看内部的逻辑了：
- checkEnd: 判断是否所有 effect 执行完毕，如果执行完毕设置 completed 为 true，接着调用 parentCallback(results)
- 遍历 keys 创建 childCallbacks，每个回调函数都是 chCbAtKey，它内部做了三件事：
  - 先判断如果 completed 为真就直接返回
  - isErr || shouldComplete(res): 判断 effect 的执行过程中是否产生错误或是被终端或取消，如果有则取消父任务并返回结果
  - 如果上述判断为假则说明 effect 正确执行完毕，这时给 results 赋值当前结果，completedCount 自增一，接着调用 checkEnd 判断是否任务全部完成
- 设置 parentCallback 的 cancel 方法，如果 completed 为假则给它赋值为真，接着调用 childCallbacks 里面的每一个对象的 cancel 方法
- 最后返回 childCallbacks

通过以上的陈述我们可以很清楚的明白 all 方法的意图，那就是阻塞父任务，等待所有 effects 执行完毕后再接续执行父任务，当然如果任何一个 effect 执行过程中报错也会终止所有的子任务，并重启父任务的执行。
```js
export function createAllStyleChildCallbacks(shape, parentCallback) {
  const keys = Object.keys(shape)
  const totalCount = keys.length

  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  let completedCount = 0
  let completed
  const results = is.array(shape) ? createEmptyArray(totalCount) : {}
  const childCallbacks = {}

  function checkEnd() {
    if (completedCount === totalCount) {
      completed = true
      parentCallback(results)
    }
  }

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }
      if (isErr || shouldComplete(res)) {
        parentCallback.cancel()
        parentCallback(res, isErr)
      } else {
        results[key] = res
        completedCount++
        checkEnd()
      }
    }
    chCbAtKey.cancel = noop
    childCallbacks[key] = chCbAtKey
  })

  parentCallback.cancel = () => {
    if (!completed) {
      completed = true
      keys.forEach(key => childCallbacks[key].cancel())
    }
  }

  return childCallbacks
}
```