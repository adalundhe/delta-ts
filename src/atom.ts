import { AtomStore } from "./types";

class Atom<T extends AtomStore<T>, K extends T["value"]> {
  private value;
  private updateFn?: (value: K) => K;
  private subscribers: Set<() => void>;

  constructor({ value, update }: { value: K; update?: (value: K) => K }) {
    this.value = value;
    this.updateFn = update;
    this.subscribers = new Set();
  }
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  update(value: K) {
    this.value = this.updateFn ? this.updateFn(value) : value;
    this.subscribers.forEach((callback) => callback());
    return this.value;
  }

  getValue() {
    return this.value;
  }

  setUpdateFn(update: (value: K) => K) {
    this.updateFn = update;
  }
}

export { Atom };
