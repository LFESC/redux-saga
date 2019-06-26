# channel
channel 不仅作为接口保留给用户，并且其它的接口内部实现也调用了 channel 的方法，比如 take。
## 源码位置
`core/src/internal/channel.js`
## 概述
channel 返回了四个方法：channel eventChannel multicastChannel stdChannel。
```js
export function channel(buffer = buffers.expanding()) {
  // ......
}

export function eventChannel(subscribe, buffer = buffers.none()) {
  // ......
}

export function multicastChannel() {
  // ......
}

export function stdChannel() {
  // ......
}
```
## 解析
channel 的实现内部依赖 buffer，所以如果你对它不了解建议去看 [buffers](./buffers.md) 这篇文章。
::: tip 名词解释：
**takers:** 存放 cb  
**buffer:** 存放 put 进来的数据
:::
### channel
首先看 channel 这个方法，它返回了一个对象，定义了四个方法：take put close flush。
```js
export function channel(buffer = buffers.expanding()) {
  let closed = false
  let takers = []

  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  // 这个方法和开发环境相关就先不看了
  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS)
    }
    if (takers.length && !buffer.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer')
    }
  }

  function put(input) {
    // ......
  }

  function take(cb) {
    // ......
  }

  function flush(cb) {
    // ......
  }

  function close() {
    // ......
  }

  return {
    take,
    put,
    flush,
    close,
  }
}
```
#### take
1.首先判断 closed 是否为 true，也就是 channel 是否终止，再判断 buffer 是否为空，如果条件成立则调用 cb(END) 终止 saga。
2.如果上述判断不成立则判断是否 buffer 不为空，如果不为空则调用 cb(buffer.take) 将 buffer 顶端的消息传递给 cb。
3.如果上述判断不成立则将 cb 放入 takers 队列。
```js
function take(cb) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  if (closed && buffer.isEmpty()) {
    cb(END)
  } else if (!buffer.isEmpty()) {
    cb(buffer.take())
  } else {
    takers.push(cb)
    cb.cancel = () => {
      remove(takers, cb)
    }
  }
}
```
#### put
1.首先判断 closed 是否为 true，为 true 表示 channel 已经关闭了，则直接 return 什么都不做。
2.接着判断 takers 是否为空，如果为空则将 input 存放到 buffer 里并返回。
3.如果上述条件不成立则从 takers 里面拿出第一个 taker，并将 input 作为参数传递给它进行调用。
```js
function put(input) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  if (closed) {
    return
  }
  if (takers.length === 0) {
    return buffer.put(input)
  }
  const cb = takers.shift()
  cb(input)
}
```
#### flush
1.首先判断如果 channel 已经关闭了并且 buffer 为空则调用 cb(END)，并返回。
2.如果上述判断不成立则用传递进来的 cb 调用 [buffer.flush()](./buffers.md#ringbuffer) 的返回值，返回值是所有 buffer 里面的数据。
```js
function flush(cb) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  if (closed && buffer.isEmpty()) {
    cb(END)
    return
  }
  cb(buffer.flush())
}
```
#### close
1. 如果 channel 已经关闭了就直接返回。   
2. 否则将 closed 赋值为 true，表示 channel 关闭不允许做 put 操作了。   
3. 清空 takers 并且调用所有的 taker，值为 END。 
```js
function close() {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  if (closed) {
    return
  }

  closed = true

  const arr = takers
  takers = []

  for (let i = 0, len = arr.length; i < len; i++) {
    const taker = arr[i]
    taker(END)
  }
}
```
### eventChannel
我们看第4行代码可知，eventChannel 是在 channel 的基础上实现的，看最终返回的代码除了没有返回 put 方法，其余和 channel 一致，所以只要理解了 channel 再理解 eventChannel 就不难了，这回我们从参数下手去看源码的实现，因为 eventChannel 和 channel 的主要差别就是 新增了 subscribe 这个参数。
```js
export function eventChannel(subscribe, buffer = buffers.none()) {
  let closed = false
  let unsubscribe

  const chan = channel(buffer)
  const close = () => {
    if (closed) {
      return
    }

    closed = true

    if (is.func(unsubscribe)) {
      unsubscribe()
    }
    chan.close()
  }

  unsubscribe = subscribe(input => {
    if (isEnd(input)) {
      close()
      return
    }
    chan.put(input)
  })

  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  unsubscribe = once(unsubscribe)

  if (closed) {
    unsubscribe()
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close,
  }
}
```
#### subscribe
subscribe 的职责是初始化外部的事件来源，比如[官方文档](https://redux-saga.js.org/docs/advanced/Channels.html)上面监听 setInterval 的那个例子。在源码中我们会执行这个 subscribe 这个方法，并传入一个方法，这个方法就是 emitter，当事件触发产生了什么 message 需要 eventChannel 里面的 taker 进行处理是，就调用 emitter(message)，这对应的就是 `chan.put(input)`，当然如果你想要结束 eventChannel 直接 emitter(END) 就可以了，所以 emitter 里面会先判断一下 `isEnd(input)` 如果成立就去执行 close()。
```js
unsubscribe = subscribe(input => {
  if (isEnd(input)) {
    close()
    return
  }
  chan.put(input)
})
```
#### close
关于 eventChannel 另一个需要将的点就是结束 eventChannel 和 channel 的结束略有不同，因为 eventChannel 监听了一个事件，所以需要在 close 之前解除对事件的监听，所以从 close() 的方法里面我们看到了 unsubscribe 方法，这也是为什么我们的 subscribe 必须要返回一个 unsubscribe 方法的原因。
```js
const close = () => {
  if (closed) {
    return
  }

  closed = true

  if (is.func(unsubscribe)) {
    unsubscribe()
  }
  chan.close()
}
```
#### buffer
eventChannel 默认是不会缓存消息的，因为 buffer 默认为 buffers.none()，所以 put 方法不会缓存 input，buffer 一直就为空，这也造成调用 take 方法时 `!buffer.isEmpty()` 为假，我们只能 `takers.push(cb)` 先将 taker 缓存起来，等到 put 调用时再去执行；最终的结果是每回 put 调用的时候就会将新的 input 交给 takers 队列里面的第一个 taker 去执行。
```js
export function eventChannel(subscribe, buffer = buffers.none()) {
 // ......
}
```
```js
function put(input) {
  if (takers.length === 0) {
    return buffer.put(input)
  }
}
```
```js
function take(cb) {
  if (closed && buffer.isEmpty()) {
    cb(END)
  } else if (!buffer.isEmpty()) {
    cb(buffer.take())
  } else {
    takers.push(cb)
    cb.cancel = () => {
      remove(takers, cb)
    }
  }
}
```
### multicastChannel
关于 multicastChannel，我并没有在官方的文档看到这个 api 的用法，我只能通过名称去揣测这个方法的作用，multicase 翻译成中文有多路广播之意，看了下源码发现确实是这个作用，下面我们就通过源码去看看它是如何实现的。
::: tip 注意：
所有的 channel 都会返回 take put close 方法，multicastChannel 也不例外，所以只要去看这几个 api 是如何实现的，也就了解了它的功能。
:::
```js
export function multicastChannel() {
  let closed = false
  let currentTakers = []
  let nextTakers = currentTakers

  const ensureCanMutateNextTakers = () => {
    // ......
  }

  const close = () => {
    // ......
  }

  return {
    [MULTICAST]: true,
    put(input) {
      // ......
    },
    take(cb, matcher = matchers.wildcard) {
      // ......
    },
    close,
  }
}
```
#### put
乍一看 multicastChannel 的 put 方法我们可能没有发现有什么特别的，我们可以对比一下 channel 的 put 方法，从上面 channel 的 put 方法的代码我们看到 put 方法会缓存 input，而且只会调用 takers 的第一个 taker 执行；但是 multicastChannel 的 put 方法正好和它相反，multicastChannel 没有接受 buffer 参数，所以它并不会缓存 input，而且它会调用所有 takers 去执行 input，我想这也是为啥它叫 multicast(多路广播)。
```js
put(input) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  if (closed) {
    return
  }

  if (isEnd(input)) {
    close()
    return
  }

  const takers = (currentTakers = nextTakers)

  for (let i = 0, len = takers.length; i < len; i++) {
    const taker = takers[i]

    if (taker[MATCH](input)) {
      taker.cancel()
      taker(input)
    }
  }
}
```
#### take
分析 take 的作用我们也可以参照上面的对比法，当和 channel 的 take 对比后我们发现 channel 的 take 会在 buffer 不为空时直接调用 cb 执行，但是 multicastChannel 并不会这样，它只会缓存进来的 cb；另外还有一个不同点就是 multicastChannel 的 take 还接收一个 match 参数，你可以传递一个比较方法，去判断 put 进来的 input 是否满足条件，如果返回 false 则不会处理这个 input。
```js
take(cb, matcher = matchers.wildcard) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }
  if (closed) {
    cb(END)
    return
  }
  cb[MATCH] = matcher
  ensureCanMutateNextTakers()
  nextTakers.push(cb)

  cb.cancel = once(() => {
    ensureCanMutateNextTakers()
    remove(nextTakers, cb)
  })
}
```
#### close
close 方法和 channel 的 close 并没有太大区别，所以这里不就讲了。
### stdChannel 
stdChannel 我也没有在文档里面看到有描述，不过和 multicastChannel 不同，stdChannel 内部是由调用的，所以接下来我们先简单分析一下 stdChannel 的代码，然后我们再看下 stdChannel 在内部的使用场景。
#### 源码分析
stdChannel 内部实际上继承了 multicastChannel，只不过修改了 put 方法其它都是一样的。
stdChannel 的 put 方法会判断 `input[SAGA_ACTION]` 是否为真，为真表示的是这个 input 是 redux-saga 的 put 方法 dispatch 的，否则就是 redux dispatch 的，如果是 put 方法调用的则直接调用 multicastChannel 的 put 方法，否则调用 asap 方法，asap 方法是定义在 scheduler 里面，所以你可以去看 [scheduler](./scheduler.md) 这篇文章了解这个方法的作用。
```js
export function stdChannel() {
  const chan = multicastChannel()
  const { put } = chan
  chan.put = input => {
    if (input[SAGA_ACTION]) {
      put(input)
      return
    }
    asap(() => {
      put(input)
    })
  }
  return chan
}
```
#### 内部使用场景
通过全局搜索 stdChannel 在以下几个地方应该到了：
**sagaMiddlewareFactory**
我们可以看到 sagaMiddlewareFactory 会接收一个 channel 参数，如果不传的会默认设置为 stdChannel，然后在 sagaMiddleware 方法里面会调用 `channel.put(action)` 我们知道 sagaMiddlewareFactory 会创建一个 middleware(sagaMiddleware)，所以每次当我们通过 redux 的 dispatch 一个 action 的时候，stdChannel 就会执行 put 方法，通过上面对 multicastChannel.put 的分析，我们知道当 dispatch(action) 的时候，会调用所有的 takers，这也就是 [take](https://redux-saga.js.org/docs/api/#takepattern) 的实现原理之一。
```js
export default function sagaMiddlewareFactory({ context = {}, channel = stdChannel(), sagaMonitor, ...options } = {}) {
  // ......
  function sagaMiddleware {
    return next => action => {
      if (sagaMonitor && sagaMonitor.actionDispatched) {
        sagaMonitor.actionDispatched(action)
      }
      const result = next(action) // hit reducers
      channel.put(action)
      return result
    }
  }
  // ......
}
```
**runSaga**
另一个会用到 stdChannel 是 runSaga，runSaga 会接收一个 channel 参数，默认值是 stdChannel。
随后会创建 env 对象，channel 是其中的一个参数。
接着 env 作为参数传递给 proc 方法。
在 proc 方法里面又会作为参数传给 runEffect 方法。
在 runEffect 方法里面会传递给 effectRunner 方法，如果看过我之前的文章的话就知道 effectRunner 就是不同 effect 创建器（take put call......）创建的 effect 处理的方法。
这里我们主要看一下处理 take 的 effectRunner: runTakeEffect，我们看到它内部调用了 channel.take 这个方法，所以至此 [take](https://redux-saga.js.org/docs/api/#takepattern) 的实现原理之二也就浮出水面了，也就是说 take 方法内部的实现原理就是 stdChannel。
::: tip 注意：
runSaga 是在 sagaMiddlewareFactory 内部调用的，所以如果你不是单独调用 runSaga 方法，sagaMiddlewareFactory 的 channel 会直接传递给 runSaga 方法。
:::
```js
export function runSaga(
  { channel = stdChannel(), dispatch, getState, context = {}, sagaMonitor, effectMiddlewares, onError = logError },
  saga,
  ...args
) {
  // ......

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
```
```js
export default function proc(env, iterator, parentContext, parentEffectId, meta, isRoot, cont) {
  // ......
  function runEffect(effect, effectId, currCb) {
    if (is.promise(effect)) {
      // ......
    } else if (is.iterator(effect)) {
      // ......
    } else if (effect && effect[IO]) {
      const effectRunner = effectRunnerMap[effect.type]
      effectRunner(env, effect.payload, currCb, executingContext)
    } else {
      // ......
    }
  }
  // ......
}
```
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
