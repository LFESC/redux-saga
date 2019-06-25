# takeEvery
在发起（dispatch）到 Store 并且匹配 pattern 的每一个 action 上派生一个 saga。
## 解析
### takeEvery
可以看到 takeEvery 内部实际上就是通过 fork 实现的，只不过 fork 的第一个参数调用的是 takeEveryHelper，所以接下来我们就看一下 takeEveryHelper。
```js
export function takeEvery(patternOrChannel, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  return fork(takeEveryHelper, patternOrChannel, worker, ...args)
}
```
### takeEveryHelper
takeEveryHelper 对应的就是下方的 takeEvery 方法，我们发现它内部的实现其实就是调用了另一个方法 fsmIterator，所以我们接下来就看一下 fsmIterator 方法。
```js
function takeEvery(patternOrChannel, worker, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })

  let action,
    setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return { nextState: 'q1', effect: yFork(action) }
      },
    },
    'q1',
    `takeEvery(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
```
### fsmIterator
fsmIterator 最终返回的是一个 iterator，这个迭代器的遍历规则就是在传入的第一个参数的几个状态之间进行跳转，初始状态就是第二个参数，如果想看内部实现的解读可以看[fsmIterator](./fsmIterator.md)，这里我们主要看一下这几个状态是如何跳转的以及它们都做了什么。
takeEvery 的状态有两个 q1 和 q2，它会不断在 q1 和 q2 状态之间切换除非有错误产生，最终返回的值为 effect，也就是 yTake 和 yFork:
- yTake 会调用 take 方法，参数就是传入的 patternOrChannel
- yFork 会调用 fork 方法，参数就是传入的 worker
这样就会产生一个效果：不断接收 action，然后执行匹配的方法，因为 fork 是非阻塞的方法，所以此时如果又接收到新的 action 也会同时执行匹配的方法，这也正是 takeEvery 的作用。