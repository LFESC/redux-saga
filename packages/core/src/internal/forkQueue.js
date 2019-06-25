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
    onAbort()
    cancelAll()
    cont(err, true)
  }

  function addTask(task) {
    tasks.push(task)
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
  }

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

  return {
    addTask,
    cancelAll,
    abort,
    getTasks,
  }
}
