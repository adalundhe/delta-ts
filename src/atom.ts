class Atom<T> {
  private value: T;
  private subscribers: Set<() => void>;
  update: (next: T) => void
  constructor(
    value: T,
    update: (set: (next: T) => T) => (next: T) => void
  ) {
    this.value = value;
    this.subscribers = new Set();

    this.update = update(this.set)
  
  }
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getSubscribers(){
    return this.subscribers
  }

  set(next: T){
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
