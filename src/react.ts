import { useMemo, useRef, useSyncExternalStore } from "react";
import useSyncExports from "use-sync-external-store/shim/with-selector.js";
import { Atom } from "./atom.ts";
import { Store } from "./store.ts";
import { Listener, StoreApi } from "./types.ts";

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
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>,
  link?: (source: T, local: T) => T
) => {

  const atomStore = useRef(
      new Atom(atom)
    ).current;

  const lastLinkedState = useRef(atom)
  

  const set = (next :T) => {
    atomStore.value = next
    atomStore.subscribers.forEach((callback) => callback())
    return next
  }

  const setUpdate = update(set)

  useMemo(() => {
    if (lastLinkedState.current !== atom && link){
      lastLinkedState.current = atom
      atomStore.value = link(lastLinkedState.current, atomStore.value)
    }

  }, [atom, atomStore, link]);

  
  return [
    useSyncExternalStore(
      (callback) => atomStore.subscribe(callback),
      () => atomStore.getState(),
      () => atomStore.getState(),
    ),
    setUpdate
  ] as [
    T,
    typeof setUpdate
  ]
};

const createAtomImpl = <T>(
  atomStore: Atom<T>,
  update: (next: T) => T | Promise<T>,
) => {
  const init = atomStore.getState();

  const useCreatedStore = <U>(
    selector: (value: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    return [
      useSyncExternalStoreWithSelector(
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
      ),
      update,
    ] as [U, typeof update];
  };

  return useCreatedStore;
};

export const atom = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>,
) => {
  const atomStore = new Atom<T>(atom);

  const set = (next: T) => {
    atomStore.value = next;
    atomStore.subscribers.forEach((callback) => callback());
    return next;
  };

  const assembledUpdate = update(set);
  return createAtomImpl(atomStore, assembledUpdate);
};

export const create = <T extends StoreApi<T>>(init: T) => {
  const store = Store.init(init);
  return createImpl(store, init);
};
