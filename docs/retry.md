# retry
创建一个 effect 描述，该描述指示中间件使用 args 作为参数调用函数 fn。
在失败的情况下，如果多次尝试小于 maxTries，则在延迟毫秒之后尝试另一个调用。
## 解析
可以看到 throttle 内部实际上就是通过 call 实现的，只不过 call 的第一个参数调用的是 retryHelper，所以接下来我们就看一下 retryHelper。
```js
export function retry(maxTries, delayLength, worker, ...args) {
  return call(retryHelper, maxTries, delayLength, worker, ...args)
}
```
### retryHelper
retryHelper 对应的就是下方的 retry 方法，我们发现它内部的实现其实就是调用了另一个方法 fsmIterator，所以我们接下来就看一下 fsmIterator 方法。
```js
export default function retry(maxTries, delayLength, fn, ...args) {
  let counter = maxTries

  const yCall = { done: false, value: call(fn, ...args) }
  const yDelay = { done: false, value: delay(delayLength) }

  return fsmIterator(
    {
      q1() {
        return {nextState: 'q2', effect: yCall, errorState: 'q10'}
      },
      q2() {
        return {nextState: qEnd}
      },
      q10 (error) {
        counter -= 1
        if (counter <= 0) {
          throw error
        }
        return {nextState: 'q1', effect: yDelay}
      },
    },
    'q1',
    `retry(${fn.name})`,
  )
}
```
### fsmIterator
fsmIterator 最终返回的是一个 iterator，这个迭代器的遍历规则就是在传入的第一个参数的几个状态之间进行跳转，初始状态就是第二个参数，如果想看内部实现的解读可以看[fsmIterator](./fsmIterator.md)，这里我们主要看一下这几个状态是如何跳转的以及它们都做了什么。
执行顺序：
- 没有错误时：q1 -> q2 -> qEnd
- 有错误时：q1 -> q10 -> q1 -> q2 -> qEnd
各个状态做了什么：
- q1: q1 会执行 yCall 也就是 call 方法，执行成功跳转到 q2，失败则跳转到 q10
- q2: q2 不会执行什么方法，直接指向下一个状态 qEnd，qEnd 就是任务完成，停止遍历
- q10: counter 减一然后判断 counter 是否小于等于零，如果成立表示可重复的次数已经用尽，直接 throw error；否则执行 yDelay 也就是 delay 延迟给定的时间之后再跳转到 q1 状态重新调用方法