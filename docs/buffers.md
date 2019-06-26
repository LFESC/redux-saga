# buffers
Buffer 用于为 channel 实现缓存策略。  
Buffer 接口定义了四个方法：isEmpty put take flush。  
buffers 文件提供了5种类型的 Buffer：none fixed expanding dropping sliding。
## 源码地址
`packages/core/src/internal/buffers.js`
## 解析
buffers 文件向外导出了5种方法，我上面已经说过了我它会创建5种类型的 Buffer 对象，所以接下来我们一一看一下这几个 Buffer 的内部逻辑。
```js
import { kTrue, noop } from './utils'

const BUFFER_OVERFLOW = "Channel's Buffer overflow!"

const ON_OVERFLOW_THROW = 1
const ON_OVERFLOW_DROP = 2
const ON_OVERFLOW_SLIDE = 3
const ON_OVERFLOW_EXPAND = 四

const zeroBuffer = { isEmpty: kTrue, put: noop, take: noop }

function ringBuffer(limit = 10, overflowAction) {
  return {
    isEmpty,
    put,
    take,
    flush
  }
}

export const none = () => zeroBuffer
export const fixed = limit => ringBuffer(limit, ON_OVERFLOW_THROW)
export const dropping = limit => ringBuffer(limit, ON_OVERFLOW_DROP)
export const sliding = limit => ringBuffer(limit, ON_OVERFLOW_SLIDE)
export const expanding = initialSize => ringBuffer(initialSize, ON_OVERFLOW_EXPAND)
```
### none
none 就是不缓存，它的 isEmpty 永远返回 true，put 和 take 方法都是 noop，我们知道 buffer 在 channel 是用来缓存 put 方法接收的 message 的，那 none 如果传递给 channel 对象就表示不缓存任何 message，如果 put 执行的时候 takers 为空就会丢弃掉这个 message。
```js
const zeroBuffer = { isEmpty: kTrue, put: noop, take: noop }

export const none = () => zeroBuffer
```
### ringBuffer
因为后续四个 Buffer 内部实现都是基于 ringBuffer，所以我们需要先介绍一下这个方法，如果这个方法你明白了，那 Buffer 这块你就明白了。
我们可以看到 ringBuffer 返回一个对象，这个对象有四个方法：isEmpty put take flush，这也就是我们上面说的 Buffer 对应的那四个 api。
那我们接下来就看下这四个 api
```js
function ringBuffer(limit = 10, overflowAction) {
  let arr = new Array(limit)
  let length = 0
  let pushIndex = 0
  let popIndex = 0

  const push = it => {
    // ......
  }

  const take = () => {
    // ......
  }

  const flush = () => {
    // ......
  }

  return {
    isEmpty: () => length == 0,
    put: it => {
      // ......      
    },
    take,
    flush,
  }
}
```
#### isEmpty
isEmpty 比较简单就是判断一下 length 是否为零
```js
isEmpty: () => length == 0,
```
#### put
我这里将 put 方法做了简化
- 首先判断 length 是否小于 limit，如果小于则调用 put 方法
- 此 put 方法不是向外部暴露的 put 方法，它是内部定义的一个方法，它会将传入的对象添加到 arr 数组上，并修改 pushIndex，length 加一
- 如果 length 大于等于 limit 说明缓存队列溢出了，而对于溢出的不同处理就是 fixed expanding dropping sliding 这几个 Buffer 根本异同点，所以我们在讲到它们的时候再讲
```js
put: it => {
  if (length < limit) {
    push(it)
  } else {
    let doubledLimit
    switch (overflowAction) {
      // ......
    }
  }
},
```
```js
const push = it => {
  arr[pushIndex] = it
  pushIndex = (pushIndex + 1) % limit
  length++
}
```
#### take
take 方法会从队列里面取第一个元素返回，这也符合队列先进先出的特性
- 先判断 length 是否为零，如果为零说明没有可以弹出的元素，则什么都不做
- 如果不为零，则首先获取队列里面第一个放入的元素赋值为 it
- 然后将 popIndex 对应的值置空
- 修改 popIndex
- 返回 it
```js
const take = () => {
  if (length != 0) {
    let it = arr[popIndex]
    arr[popIndex] = null
    length--
    popIndex = (popIndex + 1) % limit
    return it
  }
}
```
#### flush 
循环调用 take 方法，弹出所有队列里面的元素，最终所有变量都会变成初始状态。
```js
const flush = () => {
  let items = []
  while (length) {
    items.push(take())
  }
  return items
}
```
### fixed
fixed 的意思是新消息将被缓存，最多缓存 limit 条。溢出时将会报错。
我们在讲 ringBuffer 的 put 方法时说过如果 length >= limit 则将进入 switch 语句块，这个语句块就是处理不同 Buffer 溢出时的操作的，对于 fixed 传入的 overflowAction 是 ON_OVERFLOW_THROW 它对应的语句就是 `throw new Error(BUFFER_OVERFLOW)` 也就是报错。
```js
export const fixed = limit => ringBuffer(limit, ON_OVERFLOW_THROW)
```
```js
switch (overflowAction) {
  case ON_OVERFLOW_THROW:
    throw new Error(BUFFER_OVERFLOW)
  // ......
}
```
### sliding
与 fixed 类似，但溢出时将会把新消息插到缓存的最尾处，并丢弃缓存中最老的消息。
- `arr[pushIndex] = it`: 如果 limit = 10，那么第一次溢出时 pushIndex = 0，所以溢出时会丢弃缓存中最老的消息
- `pushIndex = (pushIndex + 1) % limit`: 修改 pushIndex，算法和没有溢出的时候一样，最终的 index 值会在 0 - 9 之间重复
- `popIndex = pushIndex`: 将 popIndex 置为新的 pushIndex，这就意味着 popIndex 永远会取前一个消息，因为此时最老的消息已经被覆盖了。 
```js
export const sliding = limit => ringBuffer(limit, ON_OVERFLOW_SLIDE)
```
```js
case ON_OVERFLOW_SLIDE:
  arr[pushIndex] = it
  pushIndex = (pushIndex + 1) % limit
  popIndex = pushIndex
  break
```
### expanding
与 fixed 类似，但溢出时将会使缓存动态扩展。
- `doubledLimit = 2 * limit`: 首先给 doubledLimit 赋值为 limit 的二倍，这个就是新的数组长度
- `arr = flush()`: 调用 flush 方法弹出所有元素并赋值为 arr，这一步的目的我认为是将所有的变量置为初始状态
- `length = arr.length`: 重新赋值 length
- `pushIndex = arr.length`: 重新赋值 pushIndex
- `popIndex = 0`: 重新赋值 popIndex
- `arr.length = doubledLimit`: 扩展 arr
- `limit = doubledLimit`: 重新赋值 limit
- `push(it)`: 放入新的消息
```js
export const expanding = initialSize => ringBuffer(initialSize, ON_OVERFLOW_EXPAND)
```
```js
case ON_OVERFLOW_EXPAND:
  doubledLimit = 2 * limit

  arr = flush()

  length = arr.length
  pushIndex = arr.length
  popIndex = 0

  arr.length = doubledLimit
  limit = doubledLimit

  push(it)
  break
```
### dropping
与 fixed 类似，但溢出时将会静默地丢弃消息。
如果以上哪几种情况都没有匹配那就会进入 default 就是什么都不做，也就达到了丢弃消息的目的。
```js
export const dropping = limit => ringBuffer(limit, ON_OVERFLOW_DROP)
```
```js
default:
  // DROP
```