export type Listener<T> = (next: Partial<T>) => void;

export type Store<S> = {
  state: S;
  subscribers: Set<Listener<S>>;
  subscribe: (callback: Listener<S>) => () => boolean;
  getState: () => S;
  getInitState: () => S;
  setState: ({ next, replace }: { next: S; replace?: boolean }) => void;
  delete: (callback: Listener<S>) => void;
};

export type AtomStore<T> = {
  value: T;
  update: (next: T) => void;
  subscribers: Set<Listener<T>>;
  subscribe: (callback: Listener<T>) => () => boolean;
  getState: (atom?: Atom<T>) => T;
  getInitState: () => T;
  setState: (state: T) => void;
  delete: (callback: Listener<T>) => void;
};

export type Atom<T> = {
  value: T;
  subscribers: Set<Listener<T>>;
  get: (next?: Read<T>) => T;
  set: (next: T | Read<T>) => void;
  subscribe: (
    callback: Listener<T>,
    comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
  ) => () => void;
};

export type Atomic<T> = (
  creator: T | Read<T>,
  link?: ((source: T, local: T) => T) | undefined,
) => Atom<T>;

export type Getter = <Value>(atom: Atom<Value>) => Value;
export type Read<Value> = (get: Getter) => Value;
