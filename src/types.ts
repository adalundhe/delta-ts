export type Listener = () => void;

export type Atom<T> = {
  value: T,
  subscribers: Set<Listener>,
  subscribe: (callback: Listener) => () => boolean,
  getState: () => T
  getInitState: () => T
}


export type Store<S> = {
  state: S,
  subscribers: Set<Listener>,
  subscribe: (callback: Listener) => () => boolean,
  getState: () => S,
  getInitState: () => S
  setState: (state: S) => void
}