import { useMemo, useSyncExternalStore } from "react";
import { Atom } from "./atom";
import { Store } from "./store";
import { AtomStore, StoreApi, StoreKey } from "./types";

const useSelector = <T extends StoreApi<T>>(
  store: Store<T>,
  selector: (state: {
    [Key in keyof T]: T[Key];
  }) => {
    [Key in StoreKey<T>]: Partial<T[Key]>;
  },
) => {
  const state = store.getStore();
  return useMemo(
    () =>
      selector(state) as {
        [Key in keyof T]: T[Key];
      },
    [state, selector],
  );
};

const createImpl = <T extends StoreApi<T>>(store: Store<T>, init: T) => {
  const useCreatedStore = (
    selector: (state: {
      [Key in keyof T]: T[Key];
    }) => {
      [Key in StoreKey<T>]: Partial<T[Key]>;
    },
  ) => {
    useSyncExternalStore(
      (callback) => store.subscribe(callback),
      () => store.getStore(),
      () => init,
    );
    return useSelector(store, selector);
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
  atom: AtomStore<T> & { update: (value: T[keyof T]) => T[keyof T] },
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
