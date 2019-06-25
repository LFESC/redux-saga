# sagaMonitor
sagaMonitor 其实就是一个包含五个钩子函数的对象，在 saga 执行的不同阶段这五个钩子函数会分别触发：
1. effectTriggered: 当一个 effect 被触发时（通过 yield someEffect）
2. effectResolved: 如果该 effect 成功地被 resolve
3. effectRejected: 如果该 effect 因一个错误被 reject
4. effectCancelled: 如果该 effect 被取消
5. actionDispatched: 最后，当 Redux action 被发起时
## 源码位置
`packages/core/src/internal/proc.js`
`packages/core/src/internal/middleware.js`
## 解析
这五个钩子函数都是在 middleware 执行的时候触发的，只是分散在不同的函数内，关于 middleware 内部的执行解析可以去看[这篇文章](./proc.md)
### effectTriggered
effectTriggered 在 digestEffect 方法里面调用。
```js
function digestEffect(effect, parentEffectId, cb, label = '') {
    const effectId = nextEffectId()
    env.sagaMonitor && env.sagaMonitor.effectTriggered({ effectId, parentEffectId, label, effect })

    // ......
}
```
### effectResolved
effectResolved 在 currCb 方法里，当 isErr 为 false 时就会触发。
```js
function currCb(res, isErr) {
  // ......

  if (env.sagaMonitor) {
    if (isErr) {
      env.sagaMonitor.effectRejected(effectId, res)
    } else {
      env.sagaMonitor.effectResolved(effectId, res)
    }
  }

  // ......
}
```
### effectRejected
effectResolved 在 currCb 方法里，当 isErr 为 true 时就会触发。
```js
function currCb(res, isErr) {
  // ......

  if (env.sagaMonitor) {
    if (isErr) {
      env.sagaMonitor.effectRejected(effectId, res)
    } else {
      env.sagaMonitor.effectResolved(effectId, res)
    }
  }

  // ......
}
```
### effectCancelled
effectCancelled 是在 cb.cancel 方法里面触发的，这个 cb 是 digestEffect，如果你去看 [proc](./proc.md) 这一篇的话你会发现 cb 是 next 方法，它负责不断执行 saga。
```js
function digestEffect(effect, parentEffectId, cb, label = '') {
  cb.cancel = () => {
    // ......

    env.sagaMonitor && env.sagaMonitor.effectCancelled(effectId)
  }
}
```
### actionDispatched
可以看到 actionDispatched 是在 saga 中间件里面调用的。
```js
function sagaMiddleware({ getState, dispatch }) {
  // ......

  return next => action => {
    if (sagaMonitor && sagaMonitor.actionDispatched) {
      sagaMonitor.actionDispatched(action)
    }

    // ......
  }
}
```