import useSyncExports from "use-sync-external-store/shim/with-selector.js";
import { Listener, Store } from "./types.ts";
import { useSyncExternalStoreWithSelectorAsync } from "./vanilla.ts";

const { useSyncExternalStoreWithSelector } = useSyncExports;

export const createStoreApi = () => {
  const implementStore = <T>(state: T) => ({
    state,
    subscribers: new Set<Listener<T>>(),
    subscribe(callback: Listener<T>) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    },
    getState() {
      return this.state;
    },
    getInitState() {
      return state;
    },
    setState({
      next,
      replace = false,
    }: {
      next: Partial<T>;
      replace?: boolean;
    }) {
      const nextState =
        typeof next === "function"
          ? (next as (next: T) => T)(next)
          : (next as T);

      if (!Object.is(nextState, this.state)) {
        this.state =
          replace ?? (typeof nextState !== "object" || nextState === null)
            ? nextState
            : Object.assign({}, this.state, nextState);
      }
    },
    delete(callback: Listener<T>) {
      this.subscribers.delete(callback);
    },
  });

  return implementStore;
};

const createInternalReference = <T>(store: Store<T>, init: T) => {
  const useCreatedStore = <U>(
    selector: (state: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    return useSyncExternalStoreWithSelector(
      (callback: Listener<T>) => store.subscribe(callback),
      () => store.getState(),
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

  Object.assign(useCreatedStore, store)

  return useCreatedStore;
};

const createStoreFromState = () => {
  const useCreatedStore = <U>(
    creator: (set: (next: Partial<U>) => void, get: () => U) => U,
  ) => {
    const createNextStore = createStoreApi();
    const store = createNextStore<U>({} as any);

    const setState = (next: Partial<U>): void => {
      store.setState({
        next,
      });
      store.subscribers.forEach((callback) => callback({}));
    };

    const getState = (): U => store.getState();

    const init = creator(setState, getState);
    store.setState({
      next: init,
    });

    return createInternalReference<U>(store, init);
  };

  return useCreatedStore;
};

const createInternalBaseReference = <T>(store: Store<T>) => {
  const useCreatedStore = <U>(
    selector: (state: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    const selection = useSyncExternalStoreWithSelectorAsync(
      store,
      selector,
      comparator
        ? (a: U, b: U) =>
            comparator({
              next: a,
              prev: b,
            })
        : undefined,
    );

    const callback = (next: Partial<T>) => {
      const requestedUpdate = {
        ...store.getState(),
        ...(next ? next : {}),
      };
      const currentState = selector(store.getState());
      const nextState = selector(requestedUpdate);
      const shouldUpdate = comparator
        ? comparator({
            next: currentState,
            prev: nextState,
          })
        : true;

      shouldUpdate &&
        store.setState({
          next: requestedUpdate,
        });
    };

    const callbackWithComparator = (
      callbackComparator: ({
        next,
        prev
      }:{
        next: U,
        prev: U
      }) => boolean,
      subscriptionCallback: (next: U) => void
    ) => {
      const currentState = store.getState()
      
      store.subscribers.add((state) => callbackComparator({
        next: state as U,
        prev: currentState as any
      }) && subscriptionCallback(state as U));
    }

    return {
      ...selection,
      get() {
        store.subscribe(callback);
        return selector(store.getState());
      },
      set(state: Partial<U>) {
        store.subscribers.forEach((callback) => {
          callback({
            ...store.getState(),
            ...state,
          });
        });
      },
      subscribe(
        callback: (next: U) => void,
        callbackComparator?: ({
          next,
          prev
        }:{
          next: U,
          prev: U
        }) => boolean
      ) {
        callbackComparator ? callbackWithComparator(
          callbackComparator,
          callback
        ) : store.subscribers.add(
            callback as (state: any) => void
          );
      },
    };
  };

  Object.assign(useCreatedStore, store)

  return useCreatedStore;
};

const createAsyncStoreFromState = () => {
  const useCreatedStore = async <U>(
    creator: (set: (next: Partial<U>) => void, get: () => U) => Promise<U>,
  ) => {
    const createNextStore = createStoreApi();
    const store = createNextStore<U>({} as any);

    const setState = (next: Partial<U>): void => {
      store.subscribers.forEach((callback) => {
        callback(next);
      });
    };

    const getState = (): U => store.getState();

    const init = await creator(setState, getState);
    store.setState({
      next: init,
    });

    return createInternalBaseReference<U>(store);
  };

  return useCreatedStore;
};



const createBaseStoreFromState = () => {
  const useCreatedStore = <U>(
    creator: (set: (next: Partial<U>) => void, get: () => U) => U,
  ) => {
    const createNextStore = createStoreApi();
    const store = createNextStore<U>({} as any);

    const setState = (next: Partial<U>): void => {
      store.subscribers.forEach((callback) => {
        callback(next);
      });
    };

    const getState = (): U => store.getState();

    const init = creator(setState, getState);
    store.setState({
      next: init,
    });

    return createInternalBaseReference<U>(store);
  };

  return useCreatedStore;
};


export const create = createStoreFromState();
export const createAsync = createAsyncStoreFromState();
export const createBase = createBaseStoreFromState()