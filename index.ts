export type FairQueueConfig = {
  /** e.g. 1 year */
  initial_duration: number
  debug?: boolean
}

export function createFairQueue<Task>(
  config: FairQueueConfig,
): FairQueue<Task> {
  return new FairQueue<Task>(config)
}

export class FairQueue<Task> {
  private user_queues: Map<string | number, UserQueue<Task>> = new Map()

  constructor(public config: FairQueueConfig) {}

  enqueue(user_id: string | number, task: Task) {
    let user_queue = this.user_queues.get(user_id)
    if (!user_queue) {
      let last_served_at = Date.now() - this.config.initial_duration
      user_queue = new UserQueue<Task>(user_id, last_served_at)
      this.user_queues.set(user_id, user_queue)
    }
    user_queue.enqueue(task)
  }

  dequeue(): Task | null {
    let now = Date.now()
    let debug = this.config.debug
    if (debug) {
      console.log()
      console.log('dequeue', { now })
    }
    let total_weight = 0
    for (let user_queue of this.user_queues.values()) {
      let queue_size = user_queue.size
      if (queue_size == 0) continue
      let duration = now - user_queue.last_served_at
      let weight = duration * (1 / queue_size)
      if (weight == 0) weight = 1
      user_queue.weight = weight
      total_weight += weight
      if (debug) {
        console.log({
          user_id: user_queue.user_id,
          queue_size,
          weight,
        })
      }
    }
    if (total_weight == 0) return null
    let dice = Math.random() * total_weight
    if (debug) {
      console.log({ total_weight, dice })
    }
    for (let user_queue of this.user_queues.values()) {
      let weight = user_queue.weight
      if (dice < weight) {
        user_queue.last_served_at = now
        return user_queue.dequeue()
      }
      dice -= weight
    }
    throw new Error('should not reach here')
  }
}

class UserQueue<Task> {
  size = 0
  head: Node<Task> | null = null
  tail: Node<Task> | null = null

  weight = 0

  constructor(public user_id: string | number, public last_served_at: number) {}

  enqueue(task: Task) {
    let new_node: Node<Task> = { task, next: null }
    let tail = this.tail
    if (tail) {
      tail.next = new_node
    } else {
      this.head = new_node
    }
    this.size++
    this.tail = new_node
  }

  dequeue(): Task | null {
    let head = this.head
    if (!head) return null
    this.head = head.next
    this.size--
    return head.task
  }
}

type Node<Task> = {
  task: Task
  next: Node<Task> | null
}
