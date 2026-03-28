export enum DeferredPriority {
  IMMEDIATE = 0,   // must resolve before anything else (e.g. death triggers)
  NORMAL = 1,      // standard effect resolution
  DELAYED = 2,     // end-of-effect cleanup (condition application, loot prompts)
}

export interface DeferredAction {
  id: string
  priority: DeferredPriority
  description: string
  execute: () => void
}

export class DeferredQueue {
  private queue: DeferredAction[] = []

  push(action: DeferredAction): void {
    this.queue.push(action)
    this.queue.sort((a, b) => a.priority - b.priority)
  }

  pop(): DeferredAction | undefined {
    return this.queue.shift()
  }

  peek(): DeferredAction | undefined {
    return this.queue[0]
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }

  size(): number {
    return this.queue.length
  }

  clear(): void {
    this.queue = []
  }

  serialize(): Array<{ id: string; priority: DeferredPriority; description: string }> {
    return this.queue.map(({ id, priority, description }) => ({ id, priority, description }))
  }
}
