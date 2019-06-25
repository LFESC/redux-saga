# takeLatest
在发起到 Store 并且匹配 pattern 的每一个 action 上派生一个 saga。并自动取消之前所有已经启动但仍在执行中的 saga 任务。
## 解析
### takeLatest
可以看到 takeEvery 内部实际上就是通过 fork 实现的，只不过 fork 的第一个参数调用的是 takeLatestHelper，所以接下来我们就看一下 takeLatestHelper。
```js
export function takeLatest(patternOrChannel, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    // ......
  }

  return fork(takeLatestHelper, patternOrChannel, worker, ...args)
}
```
### takeLatestHelper
takeLatestHelper 对应的就是下方的 takeLatest 方法，我们发现它内部的实现其实就是调用了另一个方法 fsmIterator，所以我们接下来就看一下 fsmIterator 方法。
```js
export default function takeLatest(patternOrChannel, worker, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yCancel = task => ({ done: false, value: cancel(task) })

  let task, action
  const setTask = t => (task = t)
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return task
          ? { nextState: 'q3', effect: yCancel(task) }
          : { nextState: 'q1', effect: yFork(action), stateUpdater: setTask }
      },
      q3() {
        return { nextState: 'q1', effect: yFork(action), stateUpdater: setTask }
      },
    },
    'q1',
    `takeLatest(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
```
### fsmIterator
fsmIterator 最终返回的是一个 iterator，这个迭代器的遍历规则就是在传入的第一个参数的几个状态之间进行跳转，初始状态就是第二个参数，如果想看内部实现的解读可以看[fsmIterator](./fsmIterator.md)，这里我们主要看一下这几个状态是如何跳转的以及它们都做了什么。
takeLatest 的执行顺序可能是以下两种情况之一：
1. q1 -> q2 -> q1 
2. q1 -> q3 -> q1 
当错误产生时才会跳出循环。
最终返回的值为 effect，也就是 yTake yFork 或 yCancel:
- yTake 会调用 take 方法，参数就是传入的 patternOrChannel
- yFork 会调用 fork 方法，参数就是传入的 worker
- yCancel 会调用 cancel 方法，参数就是上一个 task
下面我们来分析一下两种执行顺序：
- 第一种：当 task 为空时，会先 take 然后 york 然后再 take，这种情况只适用于前一个 york 的任务执行完之后才会触发下一个任务
- 第二种：当 task 不为空时，会先 take 然后 cancel 然后再 york，这种情况是当前一个 york 的任务还没执行完就又触发了下一个任务，此时会先取消前一个任务再执行当前的任务，保证执行的永远是最新的任务
>注：fsmIterator 的详细解读在[这篇文章](./fsmIterator.md)里