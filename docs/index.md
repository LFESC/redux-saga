# redux-saga 源码解读
本篇解读是将 api 作为入口进行解读的，因为 redux-saga 的 api 过多尤其是 effect 创建器，所以这里只是挑了常用的 api 做解读
## 版本
1.0.3
## 目录
- Middleware API
  - [createSagaMiddleware](./createSagaMiddleware.md)
  - [middleware.run](./createSagaMiddleware.md)
- Effect 创建器
  - [take](./effectCreators.md)
  - [takeEvery](./takeEvery.md)
  - [takeLatest](./takeLatest.md)
  - [takeLeading](./takeLeading.md)
  - [put](./effectCreators.md)
  - [putResolve](./effectCreators.md)
  - [call](./effectCreators.md)
  - [fork](./effectCreators.md)
  - [cancel](./effectCreators.md)
  - [cancelled](./effectCreators.md)
  - [delay](./effectCreators.md)
  - [throttle](./throttle.md)
  - [debounce](./debounce.md)
  - [retry](./retry.md)
- Effect 组合器
  - [race](./effectCreators.md)
  - [all](./effectCreators.md)
- 接口
  - [Task](./task.md)
  - [Channel](./channel.md)
  - [Buffer](./buffers.md)
  - [SagaMonitor](./sagaMonitor.md)
- 外部 API
  - [runSaga](./runSaga.md)
- 工具
  - [channel([buffer])](./channel.md)
  - [eventChannel](./channel.md)
  - [buffers](./buffers.md)
## 参考资料
- [redux-saga中文文档](https://redux-saga-in-chinese.js.org/)
- [redux-saga英文文档](https://redux-saga.js.org/)
