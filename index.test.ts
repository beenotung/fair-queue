import { createFairQueue } from './index'
import { MINUTE, SECOND } from '@beenotung/tslib/time'

function mockTime(time: number) {
  Date.now = () => time
}

let queue = createFairQueue({
  initial_duration: 5 * MINUTE,
  debug: true,
})

let zero = Date.now()

mockTime(zero + 1 * MINUTE)
/* user 1 */
queue.enqueue('user1', 'user1-task1')
queue.enqueue('user1', 'user1-task2')
queue.enqueue('user1', 'user1-task3')
queue.enqueue('user1', 'user1-task4')
/* user 2 */
queue.enqueue('user2', 'user2-task1')
queue.enqueue('user2', 'user2-task2')
queue.enqueue('user2', 'user2-task3')

for (let i = 1; i <= 4 + 3 + 1; i++) {
  mockTime(zero + 1 * MINUTE + i * SECOND)
  console.log(queue.dequeue())
}
