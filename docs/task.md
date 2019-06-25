# task
task 并不是一个直接暴露给外部的 api，它是在调用其它 api 之后返回的对象，这些 api 有：
- middleware.run
- fork
- runSaga
还有一些 api 接收 task 作为参数，这些 api 有：
- cancel
- join
## 源码地址
`packages/core/internal/newTask.js`
## 解析
newTask 顾名思义它会创建一个 task 对象，这个对象包含一些 fields 和 methods，我们接下来就分别介绍一下官网里面介绍的 methods。
在介绍主要的方法之前我先简单介绍一下前置的参数和逻辑：
- status: 表示 task 的状态
- taskResult: 表示 task 最终执行的结果
- taskError: 表示 task 执行过程中产生的错误
- deferredEnd: 参考下方 toPromise 方法
- cancelledDueToErrorTasks: 由于执行过程中报错而被取消的 tasks 数组
- queue: 任务队列，包含主任务和分支任务，关于 queue 的相关解析可以看 [forkQueue](./forkQueue.md) 这篇
```js
export default function newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont) {
  let status = RUNNING
  let taskResult
  let taskError
  let deferredEnd = null

  const cancelledDueToErrorTasks = []

  const context = Object.create(parentContext)
  const queue = forkQueue(
    mainTask,
    function onAbort() {
      cancelledDueToErrorTasks.push(...queue.getTasks().map(t => t.meta.name))
    },
    end,
  )

  function cancel() {
    // ......
  }

  function end(result, isErr) {
    // ......
  }

  function setContext(props) {
    // ......
  }

  function toPromise() {
    // ......
  }

  const task = {
    // fields
    [TASK]: true,
    id: parentEffectId,
    meta,
    isRoot,
    context,
    joiners: [],
    queue,

    // methods
    cancel,
    cont,
    end,
    setContext,
    toPromise,
    isRunning: () => status === RUNNING,
    isCancelled: () => status === CANCELLED || (status === RUNNING && mainTask.status === CANCELLED),
    isAborted: () => status === ABORTED,
    result: () => taskResult,
    error: () => taskError,
  }

  return task
}
```
### isRunning
这个方法很简单就是判断一下当前的 `status === RUNNING` 若任务还未返回或抛出了一个错误则为 true。
```js
isRunning: () => status === RUNNING
```
### isCancelled
这个方法是判断任务是否已经取消。
主要判断两个条件是否成立：
- `status === CANCELLED`: 如果当前任务的状态为 CANCELLED 则返回 true
- `(status === RUNNING && mainTask.status === CANCELLED)` 如果主任务取消并且当前任务正在执行，返回 true
```js
isCancelled: () => status === CANCELLED || (status === RUNNING && mainTask.status === CANCELLED),
```
### result
直接将任务的返回值返回
```js
result: () => taskResult,
```
### error
直接将错误对象返回
```js
error: () => taskError,
```
### toPromise
这个方法的目的是返回一个 promise 对象，如果 `status === ABORTED` 也就是任务报错了，则返回一个 rejected 状态值为 taskError 的 promise 对象，如果没有报错并且 `status !== RUNNING` 也就是任务正确执行完毕则返回一个 fulfilled 状态值为 taskResult 的 promise 对象。
>注：这个方法依赖一个方法 `deferred()` 去生成一个 promise 对象，这个方法很简单，你可以去 `pacages/deferred/src/index.js` 去看它的源码。
```js
function toPromise() {
  if (deferredEnd) {
    return deferredEnd.promise
  }

  deferredEnd = deferred()

  if (status === ABORTED) {
    deferredEnd.reject(taskError)
  } else if (status !== RUNNING) {
    deferredEnd.resolve(taskResult)
  }

  return deferredEnd.promise
}
```
### cancel
cancel 方法只有在 `status === RUNNING` 也就是 task 正在执行的时候才会执行取消操作。
- 首先设置 `status = CANCELLED`
- 其次执行 `queue.cancelAll()` 关于这个方法的详情可以去看 [forkQueue](./forkQueue.md) 这篇
- 最后执行 `end(TASK_CANCEL, false)` 
这里面也就是最后一步比较复杂，它调用了另一个方法 end，我们会在下面讲解 end 方法。
```js
/**
  This may be called by a parent generator to trigger/propagate    cancellation
  cancel all pending tasks (including the main task), then end the current task.
  父生成器可以调用它来 触发/传播 取消
  取消所有挂起的任务(包括主任务)，然后结束当前任务。

  Cancellation propagates down to the whole execution tree held by this Parent task
  It's also propagated to all joiners of this task and their execution tree/joiners
  取消将向下传播到此父任务所持有的整个执行树
  它还传播到此任务的所有参与者及其执行树/参与者

  Cancellation is noop for terminated/Cancelled tasks tasks
  取消是 noop 对于 终止/取消 的任务的任务
**/
function cancel() {
  if (status === RUNNING) {
    // Setting status to CANCELLED does not necessarily mean that the task/iterators are stopped
    // 将状态设置为 CANCELLED 并不一定意味着 任务/迭代器 被停止
    // effects in the iterator's finally block will still be executed
    // //迭代器的 finally 块中的 effects 仍然会执行
    status = CANCELLED
    queue.cancelAll()
    // Ending with a TASK_CANCEL will propagate the Cancellation to all joiners
    // 以 TASK_CANCEL 结尾将把取消传播给所有的参与者
    end(TASK_CANCEL, false)
  }
}
```
### end
end 方法里面有一个大的判断 `!isErr` 将整个代码分成两大块：
- 无 error
- 有 error
```js
function end(result, isErr) {
  if (!isErr) {
    // ......
  } else {
    // ......
  }
  // ......
}
```
#### 无 error
如果 isErr 为假表示没有错误产生，则去判断 `result === TASK_CANCEL`，如果成立说明是 task 被取消了，修改 status，给 taskResult 赋值，如果有 deferredEnd 对象，则执行 `deferredEnd.resolve(result)`，如果不成立说明 task 已经完成，操作和上面一致。
```js
if (!isErr) {
  // The status here may be RUNNING or CANCELLED
  // If the status is CANCELLED, then we do not need to change it here
  // 这里的状态可能正在运行或被取消
  // 如果取消了状态，那么我们不需要在这里更改它
  if (result === TASK_CANCEL) {
    status = CANCELLED
  } else if (status !== CANCELLED) {
    status = DONE
  }
  taskResult = result
  deferredEnd && deferredEnd.resolve(result)
}
```
#### 有 error
- 首先修改了 status 为 ABORTED
- 剩下的代码都和 sagaError 有关，这个是一个处理 sagaError 里面错误的模块，会记录错误信息，最终返回给 onError 方法，我觉得并不是太重要，所以就不做深入展开了。
- 给 taskError 赋值
- 处理 deferredEnd 对象，这两步和上面无 error 的情况是一致的
```js
if (!isErr) {
  // ......
} else {
  status = ABORTED
  sagaError.addSagaFrame({ meta, cancelledTasks: cancelledDueToErrorTasks })

  if (task.isRoot) {
    const sagaStack = sagaError.toString()
    // we've dumped the saga stack to string and are passing it to user's code
    // we know that it won't be needed anymore and we need to clear it
    // 我们已经将 saga 堆栈转储为 string 并将其传递给用户代码
    // 我们知道它将不再需要，我们需要清理它
    sagaError.clear()
    env.onError(result, { sagaStack })
  }
  taskError = result
  deferredEnd && deferredEnd.reject(result)
}
```
#### 处理 joiners
处理完 !isError 之后，还有些逻辑需要处理：
- 调用 `task.cont` 这个 cont 就是 newTask 方法的最后一个参数，我看了一下，它的值不是 noop 就是 cb，当然 noop 是不会做任何事情的，如果是 cb 那么就是继续执行 task 之外的代码。
- 接着处理 joiners，首先遍历所有 joiners 然后执行所有 joiner 的 cb，最后将 task.joiners 置空，joiners 和 join 方法相关，join 方法会将当前 task push 到 taskToJoin.joiners 里面，当 taskToJoin 执行完毕才会执行外部的 task，这也是 join 方法的目的：创建一个 Effect 描述信息，用来命令 middleware 等待之前的一个分叉任务的结果。
```js
task.cont(result, isErr)
task.joiners.forEach(joiner => {
  joiner.cb(result, isErr)
})
task.joiners = null
```