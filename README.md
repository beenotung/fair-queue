# fair-queue

A fair, queue-based rate-limiting library for Node.js and browsers that prioritizes users with shorter queues and ensures quick responsiveness for new users under high load.

[![npm Package Version](https://img.shields.io/npm/v/fair-queue)](https://www.npmjs.com/package/fair-queue)
[![Minified Package Size](https://img.shields.io/bundlephobia/min/fair-queue)](https://bundlephobia.com/package/fair-queue)
[![Minified and Gzipped Package Size](https://img.shields.io/bundlephobia/minzip/fair-queue)](https://bundlephobia.com/package/fair-queue)

## Features

- **Fair Queue Prioritization**: Balances queue size and wait time for equitable resource allocation
- **Dual Selection Modes**:
  - Randomized mode for better load distribution and responsiveness
  - Deterministic mode for predictable, highest-weight-first selection
- **New User Responsiveness**: Assigns new users an initial duration boost for quick service under load
- **FCFS for New Users**: Maintains first-come, first-served ordering for users with equal weights
- **TypeScript Support**: Full type safety and autocompletion
- **Isomorphic**: Works in both Node.js and browsers
- **Debug Mode**: Optional logging for development and troubleshooting
- **Lightweight**: Efficient queue management using linked lists

## Installation

```bash
npm install fair-queue
```

You can also install `fair-queue` with [pnpm](https://pnpm.io/), [yarn](https://yarnpkg.com/), or [slnpm](https://github.com/beenotung/slnpm)

## Usage Example

```typescript
import { createFairQueue } from 'fair-queue' // this library
import { MINUTE, SECOND } from '@beenotung/tslib/time' // external library (not included)

// Mock Date.now for testing
function mockTime(time: number) {
  Date.now = () => time
}

// Create a fair queue with 5-minute initial duration and debug mode
const queue = createFairQueue<string>({
  initial_duration: 5 * MINUTE,
  debug: true,
})

const zero = Date.now()

// Set time to 1 minute after start
mockTime(zero + 1 * MINUTE)

// Enqueue tasks for user1 (4 tasks) and user2 (3 tasks)
queue.enqueue('user1', 'user1-task1')
queue.enqueue('user1', 'user1-task2')
queue.enqueue('user1', 'user1-task3')
queue.enqueue('user1', 'user1-task4')
queue.enqueue('user2', 'user2-task1')
queue.enqueue('user2', 'user2-task2')
queue.enqueue('user2', 'user2-task3')

// Dequeue tasks over time, simulating 1-second intervals
for (let i = 1; i <= 8; i++) {
  mockTime(zero + 1 * MINUTE + i * SECOND)
  console.log(queue.dequeue())
}
```

**Expected Output** (with `debug: true`):

```
dequeue { now: 1746012104949 }
{ user_id: 'user1', queue_size: 4, weight: 75250 }
{ user_id: 'user2', queue_size: 3, weight: 100333.33333333333 }
{ total_weight: 175583.3333333333, dice: 88826.2618780697 }
user2-task1

dequeue { now: 1746012105949 }
{ user_id: 'user1', queue_size: 4, weight: 75500 }
{ user_id: 'user2', queue_size: 2, weight: 500 }
{ total_weight: 76000, dice: 13869.930289720725 }
user1-task1
...
```

This example shows how `fair-queue` prioritizes `user2` initially due to a shorter queue (3 tasks vs. 4), with weights reflecting wait time and queue size.

## Typescript Signature

```typescript
export type FairQueueConfig = {
  /** Initial duration (in milliseconds) for new users, e.g., 5 * 60 * 1000 for 5 minutes */
  initial_duration: number
  /** Enable debug logging (default: false) */
  debug?: boolean
  /** Selection mode: 'randomized' (default) or 'deterministic' */
  mode?: 'randomized' | 'deterministic'
}

export function createFairQueue<Task>(config: FairQueueConfig): FairQueue<Task>

export class FairQueue<Task> {
  constructor(config: FairQueueConfig)

  /** Enqueue a task for a user */
  enqueue(user_id: string | number, task: Task): void

  /** Dequeue and return the next task based on weighted random selection */
  dequeue(): Task | null
}
```

## Configuration Options

- `initial_duration`: Initial duration (ms) assigned to new users to boost their priority
- `mode`: Selection mode
  - `'randomized'` (default): Weighted random selection for better perspective responsiveness under load
  - `'deterministic'`: Always selects the user with highest weight
- `debug`: When `true`, logs queue sizes, weights, and selection details

## Notes

- **Weight Function**: Weight is calculated as `duration * (1 / queue_size)` where:
  - `duration`: Time passed since last served (ms)
  - `queue_size`: Number of pending tasks for the user
- **Selection Modes**:
  - Randomized mode provides better overall responsiveness by giving all users a chance proportional to their weights
  - Deterministic mode ensures the highest-weighted user always gets served next, useful for strict priority ordering
- **Abuse Mitigation**: Consider adding request pattern tracking (e.g., by IP) to prevent abuse through multiple small queues
