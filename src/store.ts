import {
  Listener,
  Store
} from "./types.ts";
import useSyncExports from "use-sync-external-store/shim/with-selector.js";

const { useSyncExternalStoreWithSelector } = useSyncExports;

const subscribers = new Set<Listener>()

const createStoreApi = () => {

  const implementStore = (state: any) => ({
    state,
    subscribers: subscribers,
    subscribe(callback: Listener) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    },
    getState(){
      return this.state
    },
    getInitState(){
      return state
    },
    setState(state: any){
      this.state = state
    }
  })

  return implementStore

}

const createInternalReference = <T>(store: Store<T>, init: T) => {
  const useCreatedStore = <U>(
    selector: (state: T) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    return useSyncExternalStoreWithSelector(
      (callback: Listener) => store.subscribe(callback),
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

  return useCreatedStore;
};

const createStoreFromState = () => {
  const useCreatedStore = <U>(
    creator: (
      set: (next: Partial<U>) => void,
      get: () => U
    ) => U
  ) => {

    const createNextStore = createStoreApi()
    const store = createNextStore({})

    const setState = (next: Partial<U>): void => {

      store.setState({
        ...store.getState(),
        ...next
      })
      store.subscribers.forEach((callback) => callback())

    }

    const getState = (): U => store.getState()

    const init = creator(setState, getState)
    store.setState(init)

    return createInternalReference<U>(
      store,
      init
    )

  };

  return useCreatedStore;
};

export const create = createStoreFromState()

