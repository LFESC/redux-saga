# resolvePromise
## 解析
resolvePromise 在 redux-saga 作为一个工具方法在很多地方都有调用，它的作用很简单就是执行传入的 promise，当 promise 执行完毕（无论成功失败）再调用传进来的 cb。
```js
export default function resolvePromise(promise, cb) {
  const cancelPromise = promise[CANCEL]

  if (is.func(cancelPromise)) {
    cb.cancel = cancelPromise
  }

  promise.then(cb, error => {
    cb(error, true)
  })
}
```