import { useMemo, useSyncExternalStore } from "react";
import useSyncExports from "use-sync-external-store/shim/with-selector";
import { Atom } from "./atom.ts";
import { Store } from "./store.ts";
import { AtomStore, StoreApi, Listener } from "./types.ts";

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
      (state: T) => selector(state),
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

export const useAtom = <T extends AtomStore<T>, K extends T["value"]>(
  atom: T,
  update?: (value: K) => K,
) => {
  const atomStore = useMemo(
    () =>
      new Atom<T, K>({
        value: atom.value as K,
        update: update,
      }),
    [atom, update],
  );

  return {
    value: useSyncExternalStore(
      (callback) => atomStore.subscribe(callback),
      () => atomStore.getValue(),
      () => atom.value,
    ) as K,
    update: (value: K) => atomStore.update(value),
  };
};

const createAtomImpl = <T extends AtomStore<T>, K extends T["value"]>(
  atom: Atom<T, K>,
  init: K,
) => {
  return () => ({
    value: useSyncExternalStore(
      (callback) => atom.subscribe(callback),
      () => atom.getValue(),
      () => init,
    ) as K,
    update: (value: K) => atom.update(value),
  });
};

export const atom = <T extends AtomStore<T>>(
  atom: T & { update: (value: T["value"]) => T["value"] },
) => {
  const atomStore = new Atom<T, typeof atom.value>({
    value: atom.value as T["value"],
    update: atom.update,
  });

  return createAtomImpl(atomStore, atom.value);
};

export const create = <T extends StoreApi<T>>(init: T) => {
  const store = Store.init(init);
  return createImpl(store, init);
};
