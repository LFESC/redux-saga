# scheduler
scheduler.js 是 redux-saga 内部的一个文件，它的作用是在 redux-saga 内部实现了一个调度程序，控制各个任务的执行顺序。
它暴露了两个 api：
- asap
- immediately

这两个 api 被内部一些模块所使用：
- [channel](./channel.md)
- [effectRunnerMap](./effectRunnerMap.md)
- [runSaga](./runSaga.md)
## 源码
`packages/core/src/internal/scheduler.js`
## 解析
因为 scheduler 代码量并不多，所以将整个文件贴再下面，并将英文注释翻译以供大家理解。
关于 asap 和 immediately 这两个最主要的 api 我会下面专门讲，所以先将代码省略了。
这里我想先介绍一下内部的几个变量和方法，为了下面将那两个 api 的时候好理解。
- queue: queue 就是一个数组或者称它为任务队列，它会缓存一些要执行的任务
- semaphore: semaphore 是一个信号标识，当它的值大于0时，表示有任务在执行，此时调度程序处于挂起的状态；当它的值小于0时，表示任务调度程序处于释放的状态，这时可以执行任务队列里面排队的所有任务
- suspend: 将 semaphore++ 表示调度程序此时有任务正在执行，处于挂起的状态
- release: 将 semaphore-- 将调度程序置为释放的状态
- flush: 调用 release 将调度程序释放，然后执行所有任务队列里面的任务
- exec: 调用 suspend 将调度程序挂起，然后执行传入进来的任务，执行完毕之后释放调度程序
```js
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
  // ......
}

/**
 * Puts the scheduler in a `suspended` state and executes a task immediately.
 * 将调度程序置于“挂起”状态，并立即执行任务。
 */
export function immediately(task) {
  // ......
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
```
### asap
如果我们猜错的话，asap 的意义是 “As Soon As Possible”，翻译成中文就是尽快，而这个方法的作用也就是如此。
我们可以发现 asap 将传入进来的 task 先缓存进了队列，只有当 semaphore 为0时也就是调度程序处于释放状态时才会立即执行所有的排队任务。
```js
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
```
### immediately
immediately 方法和它的字面意义一样，它会调用 suspend 方法将当前调度程序挂起，然后立即执行传入进来的 task，执行完毕后会释放调度程序并执行所有排队的任务。
```js
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
```