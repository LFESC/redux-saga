# fsmIterator
## 解析
我们发现 fsmIterator 内部调用的是 makeIterator，makeIterator 的作用就是返回一个迭代器，而迭代器最重要的就是 next 方法，所以我们主要看一下 next 方法。
::: tip 注意：
关于 makeIterator 的内部实现我也写了相关解析，可以去[这里](./makeIterator.md)查看
:::
```js
export default function fsmIterator(fsm, startState, name) {
  let stateUpdater,
    errorState,
    effect,
    nextState = startState

  function next(arg, error) {
    // ......
  }

  return makeIterator(next, error => next(null, error), name)
}
```
### next
next 方法决定这个迭代器每次迭代的时候的内部逻辑。
- 当 `nextState === qEnd` 的时候返回 done 迭代器结束
- 当 `error && !errorState` 的时候讲 nextState 置为 qEnd，返回 error
- 否则 `stateUpdater && stateUpdater(arg)` 如果 stateUpdater 存在就调用它
- 获取 currentState 
- 根据 currentState 结构出 nextState effect stateUpdater errorState
- 判断 `nextState === qEnd` 如果成立返回 done 否则返回 effect
```js
export const qEnd = {}
const done = value => ({ done: true, value })

function next(arg, error) {
  if (nextState === qEnd) {
    return done(arg)
  }
  if (error && !errorState) {
    nextState = qEnd
    throw error
  } else {
    stateUpdater && stateUpdater(arg)
    const currentState = error ? fsm[errorState](error) : fsm[nextState]()
    ;({ nextState, effect, stateUpdater, errorState } = currentState)
    return nextState === qEnd ? done(arg) : effect
  }
}
```