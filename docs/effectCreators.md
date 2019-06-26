# Effect 创建器
官方提供的 effect 创建器很多，我们这里就讲些典型的常用的 effect 创建器。
## 源码地址
`packages/core/src/internal/io.js`
## 解析
其实 effect 创建器的实现都是通过一个叫作 makeEffect 的方法创建了一个 effect 仅此而已，至于之后这些 effect 是如何处理的那就需要去看 [proc](./proc.md) 和 [effectRunnerMap](./effectrunnermap.md) 这两篇。
### makeEffect
在说 call put 这些 effect 创建器之前，我们需要先介绍一下 makeEffect 这个方法，所有这些 effect 创建器内部调用的都是这个方法，我们可以发现这个方法其实就是创建一个对象，内部有 IO combinator type payload 这几个属性。
- IO 我们在 [proc](./proc.md) 这篇里面讲过
- type 是我们在不同的 effect 创建器里面传过去，标识这个 effect 的类型
- payload 是这个 effect 携带的信息 
```js
const makeEffect = (type, payload) => ({
  [IO]: true,
  // this property makes all/race distinguishable in generic manner from other effects
  // 这个属性使 all/race 以通用的方式区别于其他 effects
  // currently it's not used at runtime at all but it's here to satisfy type systems
  // 目前它根本不在运行时使用，但它在这里是为了满足类型系统
  combinator: false,
  type,
  payload,
})
```
### call
我们可以看到 call 方法内部的代码很简单就是调用了 makeEffect，type 就是 CALL, payload 是 getFnCallDescriptor(fnDescriptor, args)，所以我们接下来看看这个 getFnCallDescriptor 是什么。
```js
export function call(fnDescriptor, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    // .......
  }
  return makeEffect(effectTypes.CALL, getFnCallDescriptor(fnDescriptor, args))
}
```
从 getFnCallDescriptor 这个方法里面我们可以看出其实它的主要作用就是分析第一个参数 fnDescriptor，因为 call 的使用方式有很多种，所以通过判断 fnDescriptor 来解析出 context fn args 这几个值并返回。
```js
function getFnCallDescriptor(fnDescriptor, args) {
  let context = null
  let fn

  if (is.func(fnDescriptor)) {
    fn = fnDescriptor
  } else {
    if (is.array(fnDescriptor)) {
      ;[context, fn] = fnDescriptor
    } else {
      ;({ context, fn } = fnDescriptor)
    }

    if (context && is.string(fn) && is.func(context[fn])) {
      fn = context[fn]
    }
  }

  return { context, fn, args }
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runCallEffect](./effectRunnerMap.md#runcalleffect) 方法。
:::
### fork
fork 的代码和 take 基本上时一样的，除了 makeEffect 的 type 为 FORK,
但是从 api 文档上看 fork 的返回值是一个 task 但是这里明明还是 makeEffect 返回的一个 effect。
```js
export function fork(fnDescriptor, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }
  return makeEffect(effectTypes.FORK, getFnCallDescriptor(fnDescriptor, args))
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runForkEffect](./effectRunnerMap.md#runforkeffect) 方法。
:::
### put
put 方法的实现也很简单，put 方法有两种使用方式：
- put(action)
- put(channel, action)
所以这个方法内部就是通过参数简单去判断了一下调用者的使用方式，如果第二个参数 action 为 undefined 则说明按照第一种方式使用，这时给 channel 赋值为 undefined 为了是默认参数工作，否则就是第二种方式，然后再去调用 makeEffect 方法。
```js
export function put(channel, action) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }
  if (is.undef(action)) {
    action = channel
    // `undefined` instead of `null` to make default parameter work
    // “undefined” 而不是 “null”，以使默认参数工作
    channel = undefined
  }
  return makeEffect(effectTypes.PUT, { channel, action })
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runPutEffect](./effectRunnerMap.md#runputeffect) 方法。
:::
### take
从下面的代码我们可以看出 take 的三种使用方式：
- 第一种 pattern: 这也是最常用的方式，接受一个 pattern ，然后执行 makeEffect 返回一个 { pattern } 对象
- 第二种 multicastPattern: 老实说这种我没在 api 文档上看到
- 第三种 channel: 这种也是和第一种差不多，只不过返回的是 { channel }
```js
export function take(patternOrChannel = '*', multicastPattern) {
  if (process.env.NODE_ENV !== 'production' && arguments.length) {
    // ......
  }
  if (is.pattern(patternOrChannel)) {
    return makeEffect(effectTypes.TAKE, { pattern: patternOrChannel })
  }
  if (is.multicast(patternOrChannel) && is.notUndef(multicastPattern) && is.pattern(multicastPattern)) {
    return makeEffect(effectTypes.TAKE, { channel: patternOrChannel, pattern: multicastPattern })
  }
  if (is.channel(patternOrChannel)) {
    return makeEffect(effectTypes.TAKE, { channel: patternOrChannel })
  }
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runTakeEffect](./effectRunnerMap.md#runtakeeffect) 方法。
:::
### cancel
cancel 方法接收一个参数，如果没有传递则默认值为 SELF_CANCELLATION 这个是用来判断是否是自取消的，然后调用 makeEffect。
```js
export function cancel(taskOrTasks = SELF_CANCELLATION) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  return makeEffect(effectTypes.CANCEL, taskOrTasks)
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runCancelEffect](./effectRunnerMap.md#runcanceleffect) 方法。
:::
### cancelled
这个没什么可说的，直接调用 makeEffect。
```js
export function cancelled() {
  return makeEffect(effectTypes.CANCELLED, {})
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runCancelledEffect](./effectRunnerMap.md#runcancelledeffect) 方法。
:::
### delay
delay 内部调用了 call 方法，并设置了第一个预设参数 delayP。
```js
export const delay = call.bind(null, delayP)
```
delayP 方法其实内部实现就是通过 promise 和 setTimeout，setTimeout 定时器在延迟了 ms 毫秒之后调用 promise 的 resolve，又因为外部是 call 方法所以可以阻塞指定的时间以达到延迟执行后续代码的目的。
```js
import { CANCEL } from '@redux-saga/symbols'

export default function delayP(ms, val = true) {
  let timeoutId
  const promise = new Promise(resolve => {
    timeoutId = setTimeout(resolve, ms, val)
  })

  promise[CANCEL] = () => {
    clearTimeout(timeoutId)
  }

  return promise
}
```
### race
race 内部也是返回了 makeEffect 的返回值，只不过这个返回值上面添加了一个属性 combinator 值为 true。
```js
export function race(effects) {
  const eff = makeEffect(effectTypes.RACE, effects)
  eff.combinator = true
  return eff
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runRaceEffect](./effectRunnerMap.md#runraceeffect) 方法。
:::
### all
同 race 一样也是返回了 makeEffect 的结果，只是 type 为 ALL。
```js
export function all(effects) {
  const eff = makeEffect(effectTypes.ALL, effects)
  eff.combinator = true
  return eff
}
```
::: tip 注意：
后续内容请查看 effectRunnerMap 篇的 [runAllEffect](./effectRunnerMap.md#runalleffect) 方法。
:::