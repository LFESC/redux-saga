# throttle
在发起到 Store 并且匹配 pattern 的一个 action 上派生一个 saga。 它在派生一次任务之后，仍然将新传入的 action 接收到底层的 buffer 中，至多保留（最近的）一个。但与此同时，它在 ms 毫秒内将暂停派生新的任务 —— 这也就是它被命名为节流阀（throttle）的原因。其用途，是在处理任务时，无视给定的时长内新传入的 action。
::: tip 注意：
简单来说就是函数节流在 redux-saga 里面的应用
:::
## 解析
### throttle
可以看到 throttle 内部实际上就是通过 fork 实现的，只不过 fork 的第一个参数调用的是 throttleHelper，所以接下来我们就看一下 throttleHelper。
```js
export function throttle(ms, pattern, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  return fork(throttleHelper, ms, pattern, worker, ...args)
}
```
### throttleHelper
throttleHelper 对应的就是下方的 throttle 方法，我们发现它内部的实现其实就是调用了另一个方法 fsmIterator，所以我们接下来就看一下 fsmIterator 方法。
```js
export default function throttle(delayLength, pattern, worker, ...args) {
  let action, channel

  const yActionChannel = { done: false, value: actionChannel(pattern, buffers.sliding(1)) }
  const yTake = () => ({ done: false, value: take(channel) })
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yDelay = { done: false, value: delay(delayLength) }

  const setAction = ac => (action = ac)
  const setChannel = ch => (channel = ch)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yActionChannel, stateUpdater: setChannel }
      },
      q2() {
        return { nextState: 'q3', effect: yTake(), stateUpdater: setAction }
      },
      q3() {
        return { nextState: 'q4', effect: yFork(action) }
      },
      q4() {
        return { nextState: 'q2', effect: yDelay }
      },
    },
    'q1',
    `throttle(${safeName(pattern)}, ${worker.name})`,
  )
}
```
### fsmIterator
fsmIterator 最终返回的是一个 iterator，这个迭代器的遍历规则就是在传入的第一个参数的几个状态之间进行跳转，初始状态就是第二个参数，如果想看内部实现的解读可以看[fsmIterator](./fsmIterator.md)，这里我们主要看一下这几个状态是如何跳转的以及它们都做了什么。
throttle 的状态执行顺序是：q1 -> q2 -> q3 -> q4 -> q2，只要没有错误产生就会一直执行下去。
- q1: q1 会执行 yActionChannel，yActionChannel 的 value 是 actionChannel() 它会缓存 action 并且缓存策略是 buffers.sliding(1) 说明只缓存一个 action
- q2: q2 会执行 yTake，yTake 的 value 是 take 方法
- q3: q3 会执行 yFork，yFork 的 value 是 fork 方法
- q4: q4 会执行 yDelay，yDelay 的 value 是 delay 方法，它会延迟 delayLength 参数指定的时间，在这时间里面接收的 action 都将被无视，这就是节流的含义了，以此确保用户不会因此向我们的服务器发起大量请求