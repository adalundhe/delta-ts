class Atom<T> {
  value: T;
  subscribers: Set<() => void>;
  constructor(value: T) {
    this.value = value;
    this.subscribers = new Set();
  }
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getSubscribers() {
    return this.subscribers;
  }

  getState() {
    return this.value;
  }
}

export { Atom };
