# createSagaMiddleware
这篇主要讲 createSagaMiddleware 和 middleware.run 这两个 api。
## 源码位置
`core/src/internal/middleware.js`
## 解析
### createSagaMiddleware
#### sagaMiddlewareFactory
createSagaMiddleware 就是 sagaMiddlewareFactory
```js
export default function sagaMiddlewareFactory({ context = {}, channel = stdChannel(), sagaMonitor, ...options } = {}) {
  function sagaMiddleware({ getState, dispatch }) {
    // ......
  }

  sagaMiddleware.run = (...args) => {
    // ......
  }

  sagaMiddleware.setContext = props => {
    // ......
  }

  return sagaMiddleware
}
```
#### sagaMiddleware
createSagaMiddleware 返回的是一个叫 sagaMiddleware 的方法
sagaMiddleware 就是一个 redux 的 middleware 所以它接收 getState 和 dispatch 两个参数
返回一个高阶方法，这个也是 redux 的 middleware 的要求，在这个高阶函数里面
有队 sagaMonitor 的处理，这个我们稍后会讲，然后调用了 `next(action)` 这个没什么可说的
最后执行 `channel.put(action)` 然后返回 `next(action)` 的结果。
主要的逻辑就在 `channel.put(action)` 这里面，这个我们会在 [channel](./channel.md) 这篇里面详细介绍。
```js
function sagaMiddleware({ getState, dispatch }) {
  boundRunSaga = runSaga.bind(null, {
    ...options,
    context,
    channel,
    dispatch,
    getState,
    sagaMonitor,
  })

  return next => action => {
    if (sagaMonitor && sagaMonitor.actionDispatched) {
      sagaMonitor.actionDispatched(action)
    }
    const result = next(action) // hit reducers
    channel.put(action)
    return result
  }
}
```
### middleware.run
#### sagaMiddleware.run
middleware.run 对应的就是 sagaMiddleware.run 这个方法
抛开 dev 的代码，其实就执行了 `boundRunSaga(...args)` 这行代码，
而 boundRunSaga 是 runSaga 这个方法 bind 了一些前置参数： `boundRunSaga = runSaga.bind(null, {// ...})`，所以当你使用 `middleware.run(saga, ...args)` 去调用时，除了 saga 和 ...args 之外
还给 runSaga 传递了一个 object 里面包含了若干参数。
runSaga 的定义在 runSaga.js 这个文件里面，我们会在 [runSaga](./runSaga.md) 这篇里面详细介绍。
```js
boundRunSaga = runSaga.bind(null, {
  ...options,
  context,
  channel,
  dispatch,
  getState,
  sagaMonitor,
})
```
```js
sagaMiddleware.run = (...args) => {
  if (process.env.NODE_ENV !== 'production' && !boundRunSaga) {
    throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware')
  }
  return boundRunSaga(...args)
}
```

