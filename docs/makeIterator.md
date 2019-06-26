# makeIterator
makeIterator 顾名思义就是创建一个 iterator 对象。
::: tip 注意：
关于迭代器的相关知识可以参考<https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols>
:::
## 解析
- 首先创建了一个 iterator 对象，其中最重要的是 next 方法，因为这是实现迭代器协议的必要条件
- 判断当前环境下是否支持 Symbol
- 如果支持则根据可迭代协议给 iterator 定义一个 Symbol.iterator 属性，值为一个方法返回 iterator
- 否则返回 iterator
```js
export function makeIterator(next, thro = kThrow, name = 'iterator') {
  const iterator = { meta: { name }, next, throw: thro, return: kReturn, isSagaIterator: true }

  if (typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = () => iterator
  }
  return iterator
}
```