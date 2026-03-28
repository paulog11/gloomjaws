export var DeferredPriority;
(function (DeferredPriority) {
    DeferredPriority[DeferredPriority["IMMEDIATE"] = 0] = "IMMEDIATE";
    DeferredPriority[DeferredPriority["NORMAL"] = 1] = "NORMAL";
    DeferredPriority[DeferredPriority["DELAYED"] = 2] = "DELAYED";
})(DeferredPriority || (DeferredPriority = {}));
export class DeferredQueue {
    queue = [];
    push(action) {
        this.queue.push(action);
        this.queue.sort((a, b) => a.priority - b.priority);
    }
    pop() {
        return this.queue.shift();
    }
    peek() {
        return this.queue[0];
    }
    isEmpty() {
        return this.queue.length === 0;
    }
    size() {
        return this.queue.length;
    }
    clear() {
        this.queue = [];
    }
    serialize() {
        return this.queue.map(({ id, priority, description }) => ({ id, priority, description }));
    }
}
