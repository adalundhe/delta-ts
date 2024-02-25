import { useMemo, useSyncExternalStore, useRef } from "react";
import useSyncExports from "use-sync-external-store/shim/with-selector";
import { Listener, Atom } from "./types";


const { useSyncExternalStoreWithSelector } = useSyncExports;


const createAtom = <T>(atom: T) => ({
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
  }
}) as Atom<T>


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

const createAtomImpl = <T>(
  atomStore: Atom<T>,
  update: (next: T) => T | Promise<T>
) => {


  const init = atomStore.value

  const useCreatedStore = <U>(
    selector: (value: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    return [ 
      useSyncExternalStoreWithSelector(
        (callback: Listener) => atomStore.subscribe(callback),
        () => atomStore.value,
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
      update
    ] as [
      U,
      typeof update
    ]
  };

  return useCreatedStore;
};

export const atom = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>
) => {
  
  const atomStore = createAtom(atom)

  const set = (next :T) => {
    atomStore.value = next
    atomStore.subscribers.forEach((callback) => callback())
    return next
  }

  const assembledUpdate = update(set)
  return createAtomImpl(atomStore, assembledUpdate);
};
