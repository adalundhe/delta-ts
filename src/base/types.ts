export type Listener<T> = (next: Partial<T>) => void;

export type StateStore<T> = {
  value: T;
  subscribers: Set<Listener<T>>;
  comparator?: ({ next, prev }: { next: T; prev: T }) => boolean;
  setter?: (value: T) => void;
  get: (next?: Read<T>) => T;
  set: (next: T | Read<T>) => void;
  subscribe: (
    callback: Listener<T>,
    comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
  ) => () => void;
};

export type Store<T> = (
  creator: T | Read<T> | ReadWrite<T>,
  link?: ((source: T, local: T) => T) | undefined,
) => StateStore<T>;

export type Getter = <Value>(store: StateStore<Value>) => Value;
export type Read<Value> = (get: Getter) => Value;

export type StoreGetter<Value> = (
  store?: StateStore<Value extends PromiseLike<any> ? Awaited<Value> : Value>,
) => Value extends PromiseLike<any> ? Awaited<Value> : Value;
export type StoreSetter<Value> = (
  next: Partial<Value extends PromiseLike<any> ? Awaited<Value> : Value>,
) => void;
export type ReadWrite<V> = (set: StoreSetter<V>, get: StoreGetter<V>) => V;
export type Derivation<T> = (
  state: T,
  link?: (source: T, local: T) => T
) => [
  T,
  (next: T) => void
]