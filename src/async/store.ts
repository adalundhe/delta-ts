import { createInternalBaseReference, createStoreApi } from "~/base/store.ts";
import { Listener } from "~/base/types.ts";

const createAsyncStoreFromState = () => {
  const useCreatedStore = async <U>(
    creator: (set: (next: Partial<U>) => void, get: () => U) => Promise<U>,
  ) => {
    const createNextStore = createStoreApi();
    const store = createNextStore<U>({} as any);

    const setState = (next: Partial<U>): void => {
      store.subscribers.forEach((callback: Listener<U>) => {
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

export const create = createAsyncStoreFromState();
