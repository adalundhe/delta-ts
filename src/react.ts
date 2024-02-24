import { useMemo, useSyncExternalStore } from "react";
import { Store } from "./store";
import { AtomStore, StoreApi, StoreKey } from "./types";
import { Atom } from "./atom";


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

const createImpl = <T extends StoreApi<T>>(
  store: Store<T>,
  init: T
) => {
  const useCreatedStore = (
    selector: (state: {
      [Key in keyof T]: T[Key];
    }) => {
      [Key in StoreKey<T>]: Partial<T[Key]>;
    },
  ) => {

    useSyncExternalStore((callback) => store.subscribe(callback), () => store.getStore(), () => init);
    return useSelector(store, selector);
  };

  return useCreatedStore;
};



export const useAtom = <T extends AtomStore<T>, K extends T["value"]>(
  atom: T,
  update?: (value: K) => K
) => {
  const atomStore = useMemo(()=> new Atom<T, K>({
    value: atom.value as K,
    update: update
  }), [atom])

  return {
    value: useSyncExternalStore((callback) => atomStore.subscribe(callback), () => atomStore.getValue(), () => atom.value) as K,
    update: (value: K) => atomStore.update(value)
  };
}


const createAtomImpl = <T extends AtomStore<T>>() => {
  return useAtom;
};

export const atom = <T extends AtomStore<T>>() => createAtomImpl();
export const create = <T extends StoreApi<T>>(init: T) => {
  const store = Store.init(init);
  return createImpl(store, init)
};
