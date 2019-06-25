# forkQueue
forkQueue 是一个内部的模块，主要用于处理主任务和分支任务的关系的，我们知道 `middleware.run(saga, ...args)` 会创建一个主任务，saga 内部执行 fork 的时候又会创建一个任务，这个任务就是它的分支任务。
关于主任务和分支任务的关系在下方的代码官方注释里面已经写的很清楚了，我也帮你翻译成了中文，大家可以看看。
## 源码地址
`packages/core/src/internal/forkQueue.js`
## 解析
forkQueue 主要返回一个对象，在代码里面这个对象被命名为 queue，它上面有四个方法：addTask cancelAll abort getTasks。
我们接下来就详细介绍一下这四个方法。
在介绍四个方法前，先简单介绍一下顶部定义的变量和执行的逻辑:
- tasks: 一个数组，里面会包含所有的任务
- result: 主任务返回的结果
- completed: 表明任务是否已经执行完毕
- `addTask(mainTask)`: 将主任务添加到任务队列里面
```js
import { noop, remove } from './utils'

/**
 Used to track a parent task and its forks
 In the fork model, forked tasks are attached by default to their parent
 We model this using the concept of Parent task && main Task
 main task is the main flow of the current Generator, the parent tasks is the
 aggregation of the main tasks + all its forked tasks.
 Thus the whole model represents an execution tree with multiple branches (vs the
 linear execution tree in sequential (non parallel) programming)
 用于跟踪父任务及其分支
 在fork模型中，默认情况下，分叉任务被附加到父任务上
 我们使用父任务&&主任务的概念对其进行建模
 主任务是当前生成器的主要流程，父任务是
 主要任务的聚合+它的所有分叉任务。
 因此，整个模型表示具有多个分支的执行树(相对于
 顺序(非并行)编程中的线性执行树

 A parent tasks has the following semantics
 - It completes if all its forks either complete or all cancelled
 - If it's cancelled, all forks are cancelled as well
 - It aborts if any uncaught error bubbles up from forks
 - If it completes, the return value is the one returned by the main task
 父任务具有以下语义
 -如果它的所有分支完成或全部取消，它就完成了
 -如果取消了，所有的分支也都取消了
 -如果任何未捕获的错误从分支冒泡上来它将终止
 -如果它完成了，返回值就是主任务返回的值
 **/
export default function forkQueue(mainTask, onAbort, cont) {
  let tasks = []
  let result
  let completed = false

  addTask(mainTask)
  const getTasks = () => tasks

  function abort(err) {
    // ......
  }

  function addTask(task) {
    // ......
  }

  function cancelAll() {
    // ......
  }

  return {
    addTask,
    cancelAll,
    abort,
    getTasks,
  }
}
```
### addTask
addTask 方法顾名思义就是向 tasks 数组里面添加一个 task。
接着会定义 task.cont 方法，cont 方法会在 task 执行完毕之后执行。
```js
function addTask(task) {
  tasks.push(task)
  task.cont = (res, isErr) => {
    // ......
  }
}
```
#### task.cont
- task.cont 首先判断一下如果 completed 为真（任务已经完成）则直接 return
- 接着从 tasks 里面删除掉当前 task
- 接着判断是否执行过程中有错误，如果有错误则调用 abort(res) 方法
- 如果没有错误判断是否当前任务是主任务，如果是将 res 赋值给 result
- 最后判断 tasks 队列里面还有没有 task，如果为空说明所有任务执行完毕，此时赋值 completed 为真，然后调用外面传过来的 cont 方法
```js
task.cont = (res, isErr) => {
  if (completed) {
    return
  }

  remove(tasks, task)
  task.cont = noop
  if (isErr) {
    abort(res)
  } else {
    if (task === mainTask) {
      result = res
    }
    if (!tasks.length) {
      completed = true
      cont(result)
    }
  }
}
```
### cancelAll
cancelAll 的作用是取消所有队列里面的任务
- 首先判断 task 是否已经执行完毕，如果执行完毕就 return
- 如果没有执行完毕，则先将 completed 置为 true
- 接着遍历所有 tasks，对每个 task.cont 赋值为 noop，接着调用每个 task 的cancel 方法
- 最后将 tasks 置为空
```js
function cancelAll() {
  if (completed) {
    return
  }
  completed = true
  tasks.forEach(t => {
    t.cont = noop
    t.cancel()
  })
  tasks = []
}
```
### abort
abort 的作用是 task 执行过程中出现错误时终止 task 的执行。
- 首先调用外部传入的 onAbort 钩子方法
- 其次调用 cancelAll 方法取消所有 task
- 最后调用外部传入的 cont 回调方法
```js
function abort(err) {
  onAbort()
  cancelAll()
  cont(err, true)
}
```
### getTasks
最后这个方法最简单就是返回 tasks 数组
```js
const getTasks = () => tasks
```