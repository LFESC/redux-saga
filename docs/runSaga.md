# runSaga
在 [Middleware API](./middleware.md) 一篇中我们说 `middleware.run(saga, ...args)` 这个 api 其实调用的是 runSaga 这个方法，所以在这篇里我们就来讲讲 runSaga 都做了些什么。
::: tip 注意：
runSaga 不仅仅是一个内部方法，也作为 api 暴露给了用户
:::
## 源码位置
`packages/core/src/internal/runSaga.js`
## 概述
runSaga 文件里面返回一个 runSaga 主要逻辑都在里面
```js
export function runSaga() {
  // .......
}
```
## 解析
这里我把和 dev 以及 sagaMonitor 相关的代码先移除掉，剩下的就是主要逻辑
可以看到剩下的代码主要就做了三件事。
我们在 [Middleware API](./middleware.md) 那篇的末尾说到调用runSaga 方法时传递了一些前置参数在这里就是你看到的 runSaga 接收的第一个参数对象，而第二个和第三个参数才是我们调用 `middleware.run(saga, ...args)` 真正传递过去的参数，这里的 saga 就是我们要执行的那个 Generator 方法。
::: tip 注意：
sagaMonitor 的解析可以去看[这篇文章](./sagaMonitor.md)
:::
```js
export function runSaga(
  { channel = stdChannel(), dispatch, getState, context = {}, sagaMonitor, effectMiddlewares, onError = logError },
  saga,
  ...args
) {
  const iterator = saga(...args)

  const effectId = nextSagaId()

  let finalizeRunEffect
  if (effectMiddlewares) {
    const middleware = compose(...effectMiddlewares)
    finalizeRunEffect = runEffect => {
      return (effect, effectId, currCb) => {
        const plainRunEffect = eff => runEffect(eff, effectId, currCb)
        return middleware(plainRunEffect)(effect)
      }
    }
  } else {
    finalizeRunEffect = identity
  }

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
### 1.生成 iterator 对象
`const iterator = saga(...args)` 根据传进来的 saga（Generator） 生成 interator 对象。
### 2.对 finalizeRunEffect 进行赋值
这里我们假设 effectMiddlewares 是 undefined，所以 finalizeRunEffect 的值就是 identity，indentity 就是 `export const identity = v => v`（定义在utils.js里）。
### 3.返回 task
最终会返回 immediately 这个方法的执行结果，immediately 在 [scheduler](./scheduler.md) 这一篇里面有详细讲解。目前我们只需要知道传入 immediately 里面的方法会立即调用并返回执行结果就行了。
传入 immediately 的方法会调用 proc 方法生成一个 [task](./task.md) 并返回，sagaMonitor 我们先不管，那么这个 proc 方法做了什么呢，我们将在 [proc](./proc.md) 这一篇里面讲解。
```js
return immediately(() => {
  const task = proc(env, iterator, context, effectId, getMetaInfo(saga), /* isRoot */ true, noop)

  if (sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task)
  }

  return task
})
```
```js
export function immediately(task) {
  try {
    suspend()
    return task()
  } finally {
    flush()
  }
}
```