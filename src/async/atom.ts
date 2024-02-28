import { createAtomApi, getValueFromCreator } from "~/base/atom.ts";
import { Atom, Read } from "~/base/types.ts";

const getValueFromAsyncCreator = async <T>(creator: T | Read<Promise<T>>) => {
  const getState = (atom: Atom<T>): T => atom.get();
  const syncCreator = creator as (get: (atom: Atom<T>) => T) => T;

  return typeof creator === "function" ? await syncCreator(getState) : creator;
};

const createAsyncAtom = async <T>(
  creator: T | Read<Promise<T>>,
  comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
) => {
  const createNextAtom = createAtomApi();
  const atomStore = createNextAtom<T>({} as any);

  const getState = (atom: Atom<T>): T => atom.get();

  const asyncCreator = creator as (get: (atom: Atom<T>) => T) => Promise<T>;

  const init =
    typeof creator === "function" ? await asyncCreator(getState) : creator;
  atomStore.setState(init);

  const atom = {
    store: atomStore,
    get: (transform?: Read<T>) =>
      transform ? getValueFromCreator(transform) : atomStore.getState(),
    set: async (next: T | Read<Promise<T>>) => {
      const value = await getValueFromAsyncCreator(next);
      const shouldUpdate =
        !comparator ||
        comparator({
          next: value,
          prev: atomStore.getState(),
        });

      if (shouldUpdate) {
        atomStore.setState(value);
        atomStore.subscribers.forEach((callback) => {
          callback(value);
        });
      }
    },
    subscribe: (
      callback: (next: T) => void,
      callbackComparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
    ) => {
      if (callbackComparator) {
        const currentState = atomStore.getState();

        atomStore.subscribers.add(
          (state) =>
            callbackComparator({
              next: state as T,
              prev: currentState as any,
            }) && callback(state as T),
        );
      } else {
        atomStore.subscribers.add(callback as (state: any) => void);
      }
    },
  } as Atom<T>;

  return atom;
};

export const atom = createAsyncAtom;
