const queue = []
/**
  Variable to hold a counting semaphore
  变量，以保存计数信号量
  - Incrementing adds a lock and puts the scheduler in a `suspended` state (if it's not
    already suspended)
  - 递增会添加一个锁，并将调度程序置于“挂起”状态(如果它不是已经挂起了)
  - Decrementing releases a lock. Zero locks puts the scheduler in a `released` state. This
    triggers flushing the queued tasks.
  - 递减释放锁。零锁使调度程序处于“释放”状态。这触发器刷新排队的任务。
**/
let semaphore = 0

/**
  Executes a task 'atomically'. Tasks scheduled during this execution will be queued
  and flushed after this task has finished (assuming the scheduler endup in a released
  state).
  “原子地”执行任务。在此执行期间调度的任务将排队并在此任务完成后刷新(假设调度程序最终在一个release中结束)
  状态)。
**/
function exec(task) {
  try {
    suspend()
    task()
  } finally {
    release()
  }
}

/**
  Executes or queues a task depending on the state of the scheduler (`suspended` or `released`)
  根据调度程序的状态执行或对任务排队(“挂起”或“释放”)
**/
export function asap(task) {
  queue.push(task)

  if (!semaphore) {
    suspend()
    flush()
  }
}

/**
 * Puts the scheduler in a `suspended` state and executes a task immediately.
 * 将调度程序置于“挂起”状态，并立即执行任务。
 */
export function immediately(task) {
  try {
    suspend()
    return task()
  } finally {
    flush()
  }
}

/**
  Puts the scheduler in a `suspended` state. Scheduled tasks will be queued until the
  scheduler is released.
  将调度程序置于“挂起”状态。已调度任务将排队直到调度器被释放。
**/
function suspend() {
  semaphore++
}

/**
  Puts the scheduler in a `released` state.
  将调度程序置于“释放”状态。
**/
function release() {
  semaphore--
}

/**
  Releases the current lock. Executes all queued tasks if the scheduler is in the released state.
  释放当前锁。如果调度程序处于发布状态，则执行所有排队的任务。
**/
function flush() {
  release()

  let task
  while (!semaphore && (task = queue.shift()) !== undefined) {
    exec(task)
  }
}
