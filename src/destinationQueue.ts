interface IQueue<T> {
    enqueue(item: T): void;
    prequeue(item: T): void;
    dequeue(): T | undefined;
    size(): number;
    queue(): T[];
}

class Queue<T> implements IQueue<T> {
    private storage: T[] = [];

    constructor(private capacity: number = Infinity) {}

    enqueue(item: T): void {
        if (this.size() === this.capacity) {
            throw Error("Queue has reached max capacity, you cannot add more items");
        }
        this.storage.push(item);
    }
    prequeue(item: T): void {
        console.log("prequeue");
        this.storage.unshift(item);
    }
    dequeue(): T | undefined {
        return this.storage.shift();
    }
    size(): number {
        return this.storage.length;
    }
    queue(): T[] {
        return this.storage;
    }
}

export default Queue;

