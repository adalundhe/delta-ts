import { useMemo, useRef, useSyncExternalStore } from "react";
import useSyncExports from "use-sync-external-store/shim/with-selector.js";
import { Atom, Listener } from "./types.ts";
import { useSyncExternalAtomWithSelectorAsync } from "./vanilla.ts";

const { useSyncExternalStoreWithSelector } = useSyncExports;

export const createAtom = <T>(atom: T): Atom<T> =>
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
  }) as Atom<T>;

const createAtomApi = () => createAtom;

export const useAtom = <T>(
  atom: T,
  update: (set: (next: T) => T) => (next: T) => T | Promise<T>,
  link?: (source: T, local: T) => T,
) => {
  const atomStore = useRef(createAtom(atom)).current;
  const lastLinkedState = useRef(atom);

  const set = (next: T) => {
    atomStore.value = next;
    atomStore.subscribers.forEach((callback) => callback({}));
    return next;
  };

  const setUpdate = update(set);

  useMemo(() => {
    if (lastLinkedState.current !== atom && link) {
      lastLinkedState.current = atom;
      atomStore.value = link(lastLinkedState.current, atomStore.value);
    }
  }, [atom, atomStore, link]);

  return [
    useSyncExternalStore(
      (callback) => atomStore.subscribe(callback),
      () => atomStore.value,
      () => atom,
    ),
    setUpdate,
  ] as [T, typeof setUpdate];
};

const createInternalReference = <T>(atomStore: Atom<T>) => {
  const init = atomStore.value;

  const useCreatedStore = (
    selector: (value: T) => T,
    comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
  ) => {
    return [
      useSyncExternalStoreWithSelector(
        (callback: Listener<T>) => atomStore.subscribe(callback),
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
      atomStore.update,
    ] as [T, (next: T) => void];
  };

  return useCreatedStore;
};

const createStoreFromState = () => {
  const useCreatedStore = <U>(
    creator: (set: (next: U) => void, get: () => U) => [U, (next: U) => void],
  ) => {
    const createNextAtom = createAtomApi();
    const store = createNextAtom<U>({} as U);

    const setState = (next: U) => {
      store.value = next;
      store.subscribers.forEach((callback: Listener<U>) => callback({}));
      return next;
    };

    const getState = () => store.value;

    const init = creator(setState, getState);
    store.setState(init[0]);
    store.update = init[1];

    return createInternalReference<U>(store);
  };

  return useCreatedStore;
};

const createInternalBaseReference = <T>(atomStore: Atom<T>) => {
  const useCreatedStore = <U>(
    selector: (state: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    const selection = useSyncExternalAtomWithSelectorAsync(
      atomStore,
      selector,
      comparator
        ? (a: U, b: U) =>
            comparator({
              next: a,
              prev: b,
            })
        : undefined,
    );

    const callback = (next: T) => {
      const currentState = selector(atomStore.getState());
      const nextState = selector(next);
      const shouldUpdate = comparator
        ? comparator({
            next: currentState,
            prev: nextState,
          })
        : true;

      shouldUpdate && atomStore.setState(next);
    };

    const callbackWithComparator = (
      callbackComparator: ({
        next,
        prev
      }:{
        next: U,
        prev: U
      }) => boolean,
      subscriptionCallback: (next: T) => void
    ) => {
      const currentState = atomStore.getState()
      
      atomStore.subscribers.add((state) => callbackComparator({
        next: state as U,
        prev: currentState as any
      }) && subscriptionCallback(state as T));
    }

    return [
      selection,
      atomStore.update,
      () => {
        atomStore.subscribe(callback as Listener<Partial<T>>);
        return selector(atomStore.getState());
      },
      (next: T) => {
        atomStore.subscribers.forEach((callback) => {
          callback(next);
        });
      },
      (
        callback: (next: T) => void,
        callbackComparator?: ({
          next,
          prev
        }:{
          next: U,
          prev: U
        }) => boolean
      ) => {

        callbackComparator ? callbackWithComparator(
          callbackComparator,
          callback
        ) : atomStore.subscribers.add(
            callback as (state: any) => void
          );

      },
    ] as [
      U,
      (next: T) => void,
      () => U,
      (next: T) => void,
      (
        callback: (next: T) => void,
        comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
      ) => void,
    ];
  };

  return useCreatedStore;
};

const createAsyncAtomFromState = () => {
  const useCreatedStore = async <U>(
    creator: (
      set: (next: U) => void,
      get: () => U,
    ) => Promise<[U, (next: U) => void]>,
  ) => {
    const createNextAtom = createAtomApi();
    const atomStore = createNextAtom<U>({} as any);

    const setState = (next: Partial<U>): void => {
      atomStore.subscribers.forEach((callback) => {
        callback(next);
      });
    };

    const getState = (): U => atomStore.getState();

    const init = await creator(setState, getState);
    atomStore.setState(init[0]);
    atomStore.update = init[1];

    return createInternalBaseReference<U>(atomStore);
  };

  return useCreatedStore;
};


const createBaseAtomFromState = () => {
  const useCreatedStore = <U>(
    creator: (
      set: (next: U) => void,
      get: () => U,
    ) => [U, (next: U) => void],
  ) => {
    const createNextAtom = createAtomApi();
    const atomStore = createNextAtom<U>({} as any);

    const setState = (next: Partial<U>): void => {
      atomStore.subscribers.forEach((callback) => {
        callback(next);
      });
    };

    const getState = (): U => atomStore.getState();

    const init = creator(setState, getState);
    atomStore.setState(init[0]);
    atomStore.update = init[1];

    return createInternalBaseReference<U>(atomStore);
  };

  return useCreatedStore;
};

export const atom = createStoreFromState();
export const atomAsync = createAsyncAtomFromState();
export const atomBase = createBaseAtomFromState()
