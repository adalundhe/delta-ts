import { useMemo, useSyncExternalStore } from "react";
import useSyncExports from "use-sync-external-store/shim/with-selector.js";
import { Atom } from "./atom.ts";
import { Store } from "./store.ts";
import { StoreApi, Listener } from "./types.ts";


const { useSyncExternalStoreWithSelector } = useSyncExports;

export const compare = <V>({
  prev,
  next,
  is = ({ prev, next }: { prev: V; next: V }) => prev === next,
}: {
  prev: V;
  next: V;
  is?: ({ prev, next }: { prev: V; next: V }) => boolean;
}) => is({ prev, next });

const createImpl = <T extends StoreApi<T>>(store: Store<T>, init: T) => {
  const useCreatedStore = <U>(
    selector: (state: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    return useSyncExternalStoreWithSelector(
      (callback: Listener) => store.subscribe(callback),
      () => store.getStore(),
      () => init,
      selector,
      comparator
        ? (a: U, b: U) =>
            comparator({
              next: a,
              prev: b,
            })
        : undefined,
    );
  };

  return useCreatedStore;
};

export const useAtom = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>
) => {
  const atomStore = useMemo(
    () =>
      new Atom<T>(atom, update),
    [atom, update],
  );

  const setUpdate = update(atomStore.set)
  

  return [
    useSyncExternalStore(
      (callback) => atomStore.subscribe(callback),
      () => atomStore.getState(),
      () => atomStore.getState(),
    ).value,
    setUpdate
  ] as [
    T,
    typeof atomStore.update
  ]
};

const createAtomImpl = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>
) => {


  const atomStore = new Atom<T>(atom, update);
  const init = atomStore.getState()

  const useCreatedStore = <U>(
    selector: ({
      value,
      setState
    }: {
      value: T,
      setState: typeof atomStore.update
    }) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    return useSyncExternalStoreWithSelector(
      (callback: Listener) => atomStore.subscribe(callback),
      () => atomStore.getState(),
      () => init,
      selector,
      comparator
        ? (a: U, b: U) =>
            comparator({
              next: a,
              prev: b,
            })
        : undefined,
    );
  };

  return useCreatedStore;
};

export const atom = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>
) => {
  
  return createAtomImpl(atom, update);
};

export const create = <T extends StoreApi<T>>(init: T) => {
  const store = Store.init(init);
  return createImpl(store, init);
};
