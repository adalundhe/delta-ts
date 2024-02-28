import { Atom, AtomStore, Listener, Read } from "./types.ts";

export const getValueFromCreator = <T>(creator: T | Read<T>) => {
  const getState = (atom: Atom<T>): T => atom.get();
  const syncCreator = creator as (get: (atom: Atom<T>) => T) => T;

  return typeof creator === "function" ? syncCreator(getState) : creator;
};

export const createAtom = <T>(atom: T): AtomStore<T> =>
  ({
    value: atom,
    subscribers: new Set<Listener<T>>(),
    subscribe(callback: Listener<T>) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    },
    getState() {
      return this.value;
    },
    getInitState() {
      return atom;
    },
    setState(next: T) {
      this.value = next;
    },
  }) as AtomStore<T>;

export const createAtomApi = () => createAtom;

const createBaseAtom = <T>(
  creator: T | Read<T>,
  comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
) => {
  const createNextAtom = createAtomApi();
  const atomStore = createNextAtom<T>({} as any);

  const getState = (atom: Atom<T>): T => atom.get();

  const syncCreator = creator as (get: (atom: Atom<T>) => T) => T;

  const init = typeof creator === "function" ? syncCreator(getState) : creator;
  atomStore.setState(init);

  const atom = {
    store: atomStore,
    get: () => atomStore.getState(),
    set: (next: T | Read<T>) => {
      const value = getValueFromCreator(next);
      const shouldUpdate =
        !comparator ||
        comparator({
          next: value,
          prev: atomStore.getState(),
        });

      if (shouldUpdate) {
        atomStore.setState(value);
        atomStore.subscribers.forEach((callback) => {
          callback(value);
        });
      }
    },
    subscribe: (
      callback: (next: T) => void,
      callbackComparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
    ) => {
      if (callbackComparator) {
        const currentState = atomStore.getState();

        atomStore.subscribers.add(
          (state) =>
            callbackComparator({
              next: state as T,
              prev: currentState as any,
            }) && callback(state as T),
        );
      } else {
        atomStore.subscribers.add(callback as (state: any) => void);
      }
    },
  } as Atom<T>;

  return atom;
};

export const atom = createBaseAtom;
