export type Listener = () => void;

export type Atom<T> = {
  value: T,
  update: (next: T) => void
  subscribers: Set<Listener>,
  subscribe: (callback: Listener) => () => boolean,
  getState: () => T
  getInitState: () => T
  setState: (state: T) => void
}


export type Store<S> = {
  state: S,
  subscribers: Set<Listener>,
  subscribe: (callback: Listener) => () => boolean,
  getState: () => S,
  getInitState: () => S
  setState: (state: S) => void
}


export type AtomHook<T> = (
  selector: (value: T) => T, 
  comparator?: (({ next, prev }: {
    next: T;
    prev: T;
  }) => boolean) | undefined) => [
    T, 
    (next: T) => void
  ]


export type DerivedAtom<T> = (
  atom: T, 
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>, 
  link?: ((source: T, local: T) => T) | undefined
) => [
  T, 
  (next: T) => T | Promise<T>
]