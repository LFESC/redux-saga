# takeLeading
在发起到 Store 并且匹配 pattern 的每一个 action 上派生一个 saga。 它将在派生一次任务之后阻塞，直到派生的 saga 完成，然后又再次开始监听指定的 pattern。
## 解析
### takeLeading
可以看到 takeLeading 内部实际上就是通过 fork 实现的，只不过 fork 的第一个参数调用的是 takeEveryHelper，所以接下来我们就看一下 takeEveryHelper。
```js
export function takeLeading(patternOrChannel, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  return fork(takeLeadingHelper, patternOrChannel, worker, ...args)
}
```
### takeLeadingHelper
takeLeadingHelper 对应的就是下方的 takeLeading 方法，我们发现它内部的实现其实就是调用了另一个方法 fsmIterator，所以我们接下来就看一下 fsmIterator 方法。
```js
export default function takeLeading(patternOrChannel, worker, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yCall = ac => ({ done: false, value: call(worker, ...args, ac) })

  let action
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return { nextState: 'q1', effect: yCall(action) }
      },
    },
    'q1',
    `takeLeading(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
```
### fsmIterator
fsmIterator 最终返回的是一个 iterator，这个迭代器的遍历规则就是在传入的第一个参数的几个状态之间进行跳转，初始状态就是第二个参数，如果想看内部实现的解读可以看[fsmIterator](./fsmIterator.md)，这里我们主要看一下这几个状态是如何跳转的以及它们都做了什么。
takeLeading 会不断在 q1 和 q2 状态之间切换除非有错误产生，最终返回的值为 effect，也就是 yTake 和 yFork:
- yTake 会调用 take 方法，参数就是传入的 patternOrChannel
- yCall 会调用 call 方法，参数就是传入的 worker
这样就会产生一个效果：不断接收 action，然后执行匹配的方法，因为 call 是阻塞的，所以必须等到当前任务执行完毕才会执行下一个任务，这也正是 takeLeading 的作用。
::: tip 注意：  
1.fsmIterator 的详细解读在[这篇文章](./fsmIterator.md)里  
2.如果你看过 [takeEvery](./takeEvery.md) 那篇，你会发现 takeLeading 的内部实现和它极其相似，只不过 york 变成了 call 