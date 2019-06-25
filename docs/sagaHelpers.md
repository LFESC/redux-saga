# sagaHelpers
Saga 辅助函数包括：takeEvery takeLatest takeLeading throttle retry debounce。
## 源码地址
`packages/core/src/internal/io-helpers.js`
`packages/core/src/internal/sagaHelpers/*.js`
## 解析
因为这四个辅助函数内部都依赖了 fork，所以如果对 fork 内部实现不了解可以先去看看[相关文章](./effectCreators.md)
- [takeEvery](./takeEvery.md)
- [takeLatest](./takeLatest.md)
- [takeLeading](./takeLeading.md)
- [throttle](./throttle.md)
- [debounce](./debounce.md)
- [retry](./retry.md)


