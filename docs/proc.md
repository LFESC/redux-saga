# proc
proc 是 redux-saga 的核心代码之一，[effects 创建器](https://redux-saga.js.org/docs/api/#effect-creators) 创建的 effects 具体的实现逻辑就是在这里。  
## 相关源码
`proc.js`
## 解析
proc 文件返回一个 proc 方法
我将 dev 代码去除，隐藏了一些方法的内部实现，展现了 proc 方法的大致骨架。
```js
export default function proc(env, iterator, parentContext, parentEffectId, meta, isRoot, cont) {
  const finalRunEffect = env.finalizeRunEffect(runEffect)

  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
    跟踪当前 effect 取消每次 generator 运行。
    调用 runEffect 将设置一个新值在上面。
    它允许传播取消到子 effects。
  **/
  next.cancel = noop

  /** Creates a main task to track the main flow */
  /** 创建一个主任务去跟踪主流程 */
  const mainTask = { meta, cancel: cancelMain, status: RUNNING }

  /**
   Creates a new task descriptor for this generator.
   A task is the aggregation of it's mainTask and all it's forked tasks.
   为这个 generator 创建一个新的任务描述。
   任务是它的主任务和所有分叉任务的聚合。
  **/
  const task = newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont)

  const executingContext = {
    task,
    digestEffect,
  }

   /**
    cancellation of the main task. We'll simply resume the Generator with a TASK_CANCEL
    取消主要任务。我们只需使用 TASK_CANCEL 恢复 Generator
  **/
  function cancelMain() {
    if (mainTask.status === RUNNING) {
      mainTask.status = CANCELLED
      next(TASK_CANCEL)
    }
  }

   /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
    将取消逻辑附加到此任务的延续
    这将允许取消沿调用链传播
  **/
  cont.cancel = task.cancel

  // kicks up the generator
  // 启用 generator
  next()

  // then return the task descriptor to the caller
  // 然后将任务描述返回给调用者
  return task

  /**
   * This is the generator driver
   * It's a recursive async/continuation function which calls itself
   * until the generator terminates or throws
   * 这个是 generator 驱动器
   * 这是一个调用自身的递归 异步/延续 函数直到 generator 终止或抛出
   * @param {internal commands(TASK_CANCEL | TERMINATE) | any} arg - value, generator will be resumed with.
   * @param {internal commands(TASK_CANCEL | TERMINATE) | any} arg - 当值，generator 将会被恢复
   * @param {boolean} isErr - the flag shows if effect finished with an error
   * @param {boolean} isErr - 该标志显示是否 effect 以错误结束
   *
   * receives either (command | effect result, false) or (any thrown thing, true)
   * 接收(命令| effect result, false)或(任何抛出的东西，true)
   */
  function next(arg, isErr) {
    // ......
  }

  function runEffect(effect, effectId, currCb) { 
    // ......
  }

  function digestEffect(effect, parentEffectId, cb, label = '') {
    // ......
  }
}
```
### next
从上面的骨架可以看出 proc 方法里面调用了 next 这个方法。
next 方法里面有很多判断，判断传进来的参数，这里面我们先考虑最简单的方法
就是 next 的参数都是空：
这时它会调用 iterator(也就是Generator对象) 的 next 方法获取 yield 表达式生成的值 `result = iterator.next(arg)` 然后去判断 iterator 是否结束即当 `result.done === true` 时，当 iterator 执行完毕后会对 mainTask 执行一些操作，这个我们接下来会讲，当 generator 没有执行完时会调用 digestEffect 这个方法，这个我们也放在下面来讲。
>注意：iterator 就是在 [runSaga](./runSaga.md) 里面对传进来的 saga(Generator) 执行后的结果。
```js
function next(arg, isErr) {
  try {
    let result
    if (isErr) {
      result = iterator.throw(arg)
      // user handled the error, we can clear bookkept values
      // 用户处理错误，我们可以清除 bookkept 值
      sagaError.clear()
    } else if (shouldCancel(arg)) {
      /**
        getting TASK_CANCEL automatically cancels the main task
        We can get this value here
        获取 TASK_CANCEL 会自动取消主任务
        我们可以得到这个值

        - By cancelling the parent task manually
        - 手动取消父任务
        - By joining a Cancelled task
        - 通过加入一个被取消的任务
      **/
      mainTask.status = CANCELLED
      /**
        Cancels the current effect; this will propagate the cancellation down to any called tasks
        取消当前 effect; 这将把取消传播到任何被调用的任务
      **/
      next.cancel()
      /**
        If this Generator has a `return` method then invokes it
        This will jump to the finally block
        如果这个 Generator 有一个' return '方法，那么调用它这将跳转到最后一个块
      **/
      result = is.func(iterator.return) ? iterator.return(TASK_CANCEL) : { done: true, value: TASK_CANCEL }
    } else if (shouldTerminate(arg)) {
      // We get TERMINATE flag, i.e. by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
      // 我们得到了 TERMINATE 标志，也就是说，通过使用' take '(而不是' takem '来捕获 channels 的结束)从一个 channel 中获取终止标志
      result = is.func(iterator.return) ? iterator.return() : { done: true }
    } else {
      result = iterator.next(arg)
    }

    if (!result.done) {
      digestEffect(result.value, parentEffectId, next)
    } else {
      /**
        This Generator has ended, terminate the main task and notify the fork queue
        此 Generator 已结束，终止主任务并通知 fork 队列
      **/
      if (mainTask.status !== CANCELLED) {
        mainTask.status = DONE
      }
      mainTask.cont(result.value)
    }
  } catch (error) {
    if (mainTask.status === CANCELLED) {
      throw error
    }
    mainTask.status = ABORTED

    mainTask.cont(error, true)
  }
}
```
### digestEffect
```js
function digestEffect(effect, parentEffectId, cb, label = '') {
  const effectId = nextEffectId()
  env.sagaMonitor && env.sagaMonitor.effectTriggered({ effectId, parentEffectId, label, effect })

  /**
    completion callback and cancel callback are mutually exclusive
    We can't cancel an already completed effect
    And We can't complete an already cancelled effectId
    完成回调和取消回调是互斥的
    我们无法取消已完成的效果
    我们无法完成一个已经取消的effectId
  **/
  let effectSettled

  // Completion callback passed to the appropriate effect runner
  // 完成回调传递给适当的 effect 运行器
  function currCb(res, isErr) {
    if (effectSettled) {
      return
    }

    effectSettled = true
    cb.cancel = noop // defensive measure 防守措施 
    if (env.sagaMonitor) {
      if (isErr) {
        env.sagaMonitor.effectRejected(effectId, res)
      } else {
        env.sagaMonitor.effectResolved(effectId, res)
      }
    }

    if (isErr) {
      sagaError.setCrashedEffect(effect)
    }

    cb(res, isErr)
  }
  // tracks down the current cancel
  // 跟踪当前取消
  currCb.cancel = noop

  // setup cancellation logic on the parent cb
  // 在父 cb 上设置取消逻辑
  cb.cancel = () => {
    // prevents cancelling an already completed effect
    // 防止取消已完成的 effect
    if (effectSettled) {
      return
    }

    effectSettled = true

    currCb.cancel() // propagates cancel downward 向下传播取消
    currCb.cancel = noop // defensive measure 防守措施 

    env.sagaMonitor && env.sagaMonitor.effectCancelled(effectId)
  }

  finalRunEffect(effect, effectId, currCb)
}
```
### finalRunEffect
从上面的代码来看，先抛开一些赋值语句，最终调用的是 finalRunEffect 这个方法
从 proc 开头的代码我们可以知道 finalRunEffect 是 env.finalizeRunEffect 的执行结果，而 proc 方法是在 runSaga 里面调用的，在这里 finalizeRunEffect 被赋值为 identity，而 identity 只是一个原样返回参数的函数。所以 finalRunEffect 即是 runEffect 本身。
```js
let finalizeRunEffect
  if (effectMiddlewares) {
    // ......
  } else {
    finalizeRunEffect = identity
  }

  const env = {
    channel,
    dispatch: wrapSagaDispatch(dispatch),
    getState,
    sagaMonitor,
    onError,
    finalizeRunEffect,
  }

  return immediately(() => {
    const task = proc(env, iterator, context, effectId, getMetaInfo(saga), /* isRoot */ true, noop)

    if (sagaMonitor) {
      sagaMonitor.effectResolved(effectId, task)
    }

    return task
  })
}

// ----------- from runSaga.js
```
```js
export const identity = v => v

// ----------- from utils.js
```
```js
const finalRunEffect = env.finalizeRunEffect(runEffect)
```
### runEffect
这个就是最终调用的方法了，注意因为一层层调用，你可能已经忘记了 effect 参数到底是什么了，runEffect 是在 digestEffect 方法里面调用的，而 digestEffect 是在 next 方法里面调用的，而 effect 就是在 next 里面的 result，其实也就是你传入的 saga(Generator) 内部 yeild 的结果。
这里会对 effect 做一些判断，根据 effect 的值做不同的处理。
>注意：我们在 [effects](./effectCreators.md) 这一篇里面讲过 put call take 这些 effect creators 实际上只是返回一个 effect 对象要不怎么叫 effect creator 呢，至于这些 effect 是如何实现的就是在这个 runEffect 方法里面了。
```js
function runEffect(effect, effectId, currCb) {
  /**
    each effect runner must attach its own logic of cancellation to the provided callback
    it allows this generator to propagate cancellation downward.

    每个 effect 运行器必须将自己的取消逻辑附加到提供的回调中
    它允许这个 generator 向下传播取消。

    ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
    And the setup must occur before calling the callback
    注意! effect 运行程序必须通过设置 cb.cancel = [cancelMethod] 设置取消逻辑。
    而且必须在调用回调之前进行设置

    This is a sort of inversion of control: called async functions are responsible
    of completing the flow by calling the provided continuation; while caller functions
    are responsible for aborting the current flow by calling the attached cancel function
    这是一种控制反转:称为异步函数负责通过调用所提供的延续来完成流程;
    当调用函数是否负责通过调用附加的 cancel 函数中止当前流程

    Library users can attach their own cancellation logic to promises by defining a
    promise[CANCEL] method in their returned promises
    ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
    库用户可以定义他们自己的取消逻辑通过在返回的 promise 中定义一个 promise[CANCEL]方法
    注意!调用cancel必须对已完成或已取消的 effect 无影响
  **/
  if (is.promise(effect)) {
    resolvePromise(effect, currCb)
  } else if (is.iterator(effect)) {
    // resolve iterator
    // 处理 iterator
    proc(env, effect, task.context, effectId, meta, /* isRoot */ false, currCb)
  } else if (effect && effect[IO]) {
    const effectRunner = effectRunnerMap[effect.type]
    effectRunner(env, effect.payload, currCb, executingContext)
  } else {
    // anything else returned as is
    // 任何其他的返回原样
    currCb(effect)
  }
}
```
#### 当 effect 为 promise
当 effect 是 promise 的时候会给它添加一个 then 方法，如果 promise resolved，那么调用传进来的 cb 即 digestEffect 里面定义的 currCb 方法
```js
export default function resolvePromise(promise, cb) {
  const cancelPromise = promise[CANCEL]

  if (is.func(cancelPromise)) {
    cb.cancel = cancelPromise
  }

  promise.then(cb, error => {
    cb(error, true)
  })
}

// --------- from resolvePromise.js
```
#### 当 effect 为 iterator
当 effect 是 iterator 即 yield 后面的执行的又是一个 generator 方法，那么递归调用 proc 方法。
```js
// resolve iterator
// 处理 iterator
proc(env, effect, task.context, effectId, meta, /* isRoot */ false, currCb)
```
#### 当 effect[IO] === true 时
这个 effect[IO] 是个什么东西呢，其实就是 effect creators 如：call put take ...... 这些返回的对象里面会用添加一个 symbol IO 为 true，所以如果 effect[IO] === true 则表示这个 effect 是上述那些 api 产生的，所以调用这些 api 对应的 runner 去执行，下面这两句代码就是做这件事的。
受限于篇幅所限我们将在 [effectRunnerMap](./effectRunnerMap.md) 这一篇里面去讲解这些 effect 究竟是如何实现的。
>注意：effect 对象时如何产生的，以及包含了哪些参数可以去看 [effects](./effectCreators.md) 这一篇。
```js
const effectRunner = effectRunnerMap[effect.type]
effectRunner(env, effect.payload, currCb, executingContext)
```
#### 其它情况时
当 effect 是其它情况时，就调用 currCb 方法，currCb 方法又会调用 cb 参数，这个 cb 其实就是 next 方法，也就是递归调用 next，我们是从 next 方法进来一直走到现在，如果 iterator 没有执行完毕，它又会调用 next 方法执行下去，直到 iterator 执行完毕。
```js
// anything else returned as is
// 任何其他的返回原样
currCb(effect)
```
#### currCb
我觉得我有必要将 currCb 单独提出来讲一下，虽然从代码来看它的逻辑很简单，但是在 runEffect 方法里面的四种情况下都调用了 currCb 这个方法，这个方法最重要的就是内部调用了 cb 也就是 next 方法，我们知道 redux-saga 的特性之一就是 **阻塞调用/非阻塞调用** 它之所以可以实现有些方法会阻塞，有些方法能非阻塞，最重要的就是内部是基于 Generator 实现的，因为 Generator 的特性之一就是可以中断函数的执行，直到你手动调用 next() 方法，而 currCb 内部的 cb(next) 又会去调用 iterator.next() 方法，所以到这里你明白了为什么 runEffect 的四种情况都要接收 currCb 这个方法了吧，就是为了能够手动控制什么时候继续执行 saga(Generator) 方法。
```js
// Completion callback passed to the appropriate effect runner
// 完成回调传递给适当的 effect 运行器
function currCb(res, isErr) {
  if (effectSettled) {
    return
  }

  effectSettled = true
  cb.cancel = noop // defensive measure
  if (env.sagaMonitor) {
    if (isErr) {
      env.sagaMonitor.effectRejected(effectId, res)
    } else {
      env.sagaMonitor.effectResolved(effectId, res)
    }
  }

  if (isErr) {
    sagaError.setCrashedEffect(effect)
  }

  cb(res, isErr)
}
```
### next 执行完成
上面所有的都是假设 next 方法的结果 result.done 不为 true 的情况，也就是 middleware.run(saga) saga 这个 generator 没有执行完毕的情况，现在我们已经讲完 result.done 不为 true 的情况，接下来我们看一下 如果 result.done 为 true 会干什么，根据下面的代码，我们可以发现它会修改 mainTask 的状态，并且调用 cont 方法，这个 mainTask 有什么用呢，cont 方法又做了什么呢，因为这块涉及一大块的代码，所以我打算单独开一篇去讲。 
```js
/**
  This Generator has ended, terminate the main task and notify the fork queue
  此 generator 已结束，终止主任务并通知 fork 队列
**/
if (mainTask.status !== CANCELLED) {
  mainTask.status = DONE
}
mainTask.cont(result.value)
```
### next 执行报错
除了 next 执行完毕还有一种情况就是 next 执行过程中报错了，这个时候就会进入 catch 语句块，这里主要的操作和 next 完成时做的事情差不多，也是修改 mainTask 的状态，并且调用 cont 方法，所以我们也放在单独的章节去讲解。
```js
if (mainTask.status === CANCELLED) {
  throw error
}
mainTask.status = ABORTED

mainTask.cont(error, true)
```
### 返回值
proc 方法会返回一个 task 对象，关于 task 对象内部 api 的实现可以去看 [task](./task.md) 那篇文章。
## 总结
至此 Middleware API 就讲完了，主要涉及两个 api：createSagaMiddleware(options) 和 middleware.run(saga, ...args)，涉及到 [createSagaMiddleware](/.createSagaMiddleware.md)>[channel](/.channel.md)>[runSaga](./runSaga.md)>[proc](./proc.md) 这三篇文章。