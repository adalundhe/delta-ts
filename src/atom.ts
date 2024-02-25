class Atom<T, U> {
  private value: T;
  private subscribers: Set<() => void>;
  update: (U extends (
    next: T,
  ) => (prev: T) => T
    ? (next: T) => T
    : (next: T) => Promise<T>)
  constructor(
    value: T,
    update: (set: (next: T) => T) => (next: T) => T | Promise<T>
  ) {
    this.value = value;
    this.subscribers = new Set();
    
    this.update = update(this.set) as typeof this.update

  }
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getSubscribers(){
    return this.subscribers
  }

  private set(next: T){
    this.value = next
    this.subscribers.forEach((callback) => callback())
    return this.value
  }

  getState() {
    return {
      value: this.value,
      setState: this.update
    }
  }
}

export { Atom };
