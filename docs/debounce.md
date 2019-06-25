# debounce
在发起到 Store 并且匹配 pattern 的一个 action 上派生一个 saga。Saga 将在停止获取 action ms 毫秒之后调用。这是为了防止调用 saga 在 action 被处理之前。
>注：简单来说就是函数防抖在 redux-saga 里面的应用
## 解析
### debounce
可以看到 debounce 内部实际上就是通过 fork 实现的，只不过 fork 的第一个参数调用的是 debounceHelper，所以接下来我们就看一下 debounceHelper。
```js
export function debounce(delayLength, pattern, worker, ...args) {
  return fork(debounceHelper, delayLength, pattern, worker, ...args)
}
```
### debounceHelper
我们发现 debounceHelper 内部的实现其实就是调用了另一个方法 fsmIterator，所以我们接下来就看一下 fsmIterator 方法。
```js
export default function debounceHelper(delayLength, patternOrChannel, worker, ...args) {
  let action, raceOutput

  const yTake = { done: false, value: take(patternOrChannel) }
  const yRace = {
    done: false,
    value: race({
      action: take(patternOrChannel),
      debounce: delay(delayLength),
    }),
  }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yNoop = value => ({ done: false, value })

  const setAction = ac => (action = ac)
  const setRaceOutput = ro => (raceOutput = ro)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return { nextState: 'q3', effect: yRace, stateUpdater: setRaceOutput }
      },
      q3() {
        return raceOutput.debounce
          ? { nextState: 'q1', effect: yFork(action) }
          : { nextState: 'q2', effect: yNoop(raceOutput.action), stateUpdater: setAction }
      },
    },
    'q1',
    `debounce(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
```
### fsmIterator
fsmIterator 最终返回的是一个 iterator，这个迭代器的遍历规则就是在传入的第一个参数几个状态之间进行跳转，初始状态就是第二个参数，如果想看内部实现的解读可以看[fsmIterator](./fsmIterator.md)，这里我们主要看一下这几个状态是如何跳转的以及它们都做了什么。
debounce 的状态执行顺序是以下两种之一：
1. q1 -> q2 -> q1
2. q1 -> q2 -> q2
只要没有错误产生就会一直执行下去。
- q1: q1 会执行 yTake，yTake 的 value 是 take 方法
- q2: q2 会执行 yRace，yRace 的 value 是 race 方法，race 方法内部会让 take 和 delay 竞赛
- q3: q3 会判断竞赛的结果，如果 delay 获胜（也就是这段时间没有接收到新的 action）就调用 yFork，yFork 的 value 是 fork 方法；如果 take 获胜（也就是这段时间接收到了新的 action）就调用 yNoop，yNoop 什么都不做只是单纯的返回一个对象，如果 delay 获胜接下来执行的是 q1，如果 take 获胜接下来执行的是 q2

通过以上的逻辑就达到一个目的每个 take 接收后的处理方法的执行间隔都是固定的就是你传进来的 delayLength，也就达到了函数去抖的目的了。