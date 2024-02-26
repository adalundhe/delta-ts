import { useMemo, useSyncExternalStore, useRef } from "react";
import useSyncExports from "use-sync-external-store/shim/with-selector.js";
import { Listener, Atom } from "./types.ts";


const { useSyncExternalStoreWithSelector } = useSyncExports;


const createAtom = <T>(
  atom: T,
) => ({
  value: atom,
  subscribers: new Set<Listener>(),
  subscribe(callback: Listener) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },
  getState(){
    return this.value
  },
  getInitState(){
    return atom
  },
  setState(state: T){
    this.value = state
  }
}) as Atom<T>


const createAtomApi = () => createAtom


export const useAtom = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>,
  link?: (source: T, local: T) => T
) => {

  const atomStore = useRef(createAtom(atom)).current;
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
      () => atomStore.value,
      () => atom,
    ),
    setUpdate
  ] as [
    T,
    typeof setUpdate
  ]
};

const createInternalReference = <T>(
  atomStore: Atom<T>
) => {
  const init = atomStore.value

  const useCreatedStore = (
    selector: (value: T) => T,
    comparator?: ({ next, prev }: { next: T; prev: T }) => boolean
  ) => {
    return [
      useSyncExternalStoreWithSelector(
        (callback: Listener) => atomStore.subscribe(callback),
        () => atomStore.value,
        () => init,
        selector,
        comparator
          ? (a: T, b: T) =>
              comparator({
                next: a,
                prev: b,
              })
          : undefined,
      ),
      atomStore.update
    ] as [
      T,
      (next: T) => void
    ]
  };

  return useCreatedStore;
};

const createStoreFromState = () => {

  const useCreatedStore = <U>(
    creator: (set: (next: U) => void) => [
      U,
      (next: U) => void
    ]
  ) => {

    const createNextAtom = createAtomApi()
    const store = createNextAtom<U>(
      {} as U
    )

    const setState = (next: U) => {
      store.value = next
      store.subscribers.forEach((callback: Listener) => callback())
      return next
    }

    const init = creator(setState)
    store.setState(init[0])
    store.update = init[1]

    return createInternalReference<U>(
      store
    )

  }

  return useCreatedStore
}

const createAsyncStoreFromState = () => {

  const useCreatedAsyncStore = async <U>(
    creator: (set: (next: U) => void) => Promise<[
      U,
      (next: U) => void
    ]>
  ) => {

    const createNextAtom = createAtomApi()
    const store = createNextAtom<U>(
      {} as U
    )

    const setState = (next: U) => {
      store.value = next
      store.subscribers.forEach((callback: Listener) => callback())
      return next
    }

    const init = await creator(setState)
    store.setState(init[0])
    store.update = init[1]

    return createInternalReference<U>(
      store
    )

  }

  return useCreatedAsyncStore
}

export const atom = createStoreFromState()
export const asyncAtom = createAsyncStoreFromState()