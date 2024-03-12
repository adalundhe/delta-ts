import { useMemo, useReducer, useRef } from "react";
import { createBaseStore, isPromiseLike, use } from "~/base/store";
import { ReadWrite, StateStore } from "~/base/types.ts";

const createStore = <T, U>(
  store: StateStore<T>,
  init: T | ReadWrite<T>,
  selector: (state: Awaited<T>) => U,
  comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
) => {
  store.comparator = comparator as typeof store.comparator;
  store.value = selector(
    (isPromiseLike(init) ? use(init) : init) as Awaited<T>,
  ) as unknown as T;

  return store as unknown as StateStore<U>;
};

const createInternalAtomReference = <T>(
  atom: StateStore<T>,
  init: T | ReadWrite<T>,
) => {
  const useCreatedStore = <U>(
    selector: (state: Awaited<T>) => U,
    comparator?: ({ next, prev }: { next: U; prev: U }) => boolean,
  ) => {
    const atomRef = useRef(
      createStore(atom, init, selector, comparator),
    ).current;

    const prev = useRef(atomRef.value);

    const [_, rerender] = useReducer((_: U, next: U) => {
      atomRef.value = next;
      return next;
    }, atomRef.value);

    useMemo(() => {
      atomRef.subscribe((next) => {
        if (!Object.is(prev.current, next)) {
          prev.current = next as U;
          rerender(next as U);
        }
      });
    }, [atomRef]);

    atomRef.value = prev.current;

    return atomRef.value as unknown as U;
  };

  return useCreatedStore;
};

const createStoreFromState = () => {
  const useCreatedStore = <U>(creator: ReadWrite<U>) => {
    const store = createBaseStore({} as any);

    const setState = (next: Partial<U>): void => {
      store.set({
        ...store.get(),
        ...next,
      } as U);
    };

    const getState = (
      selected?: StateStore<U>,
    ): U extends PromiseLike<any> ? Awaited<U> : U =>
      selected ? selected.get() : store.get();

    const init = creator(setState, getState as any);

    return createInternalAtomReference<U>(store, init);
  };

  return useCreatedStore;
};

export const useDerived = <U>(state: U, link?: (source: U, local: U) => U) => {
  const lastState = useRef(state);
  const nextState = useRef(state);
  const lastLinked = useRef(state);

  useMemo(() => {
    if (lastLinked.current !== state && link) {
      lastLinked.current = state;
      lastState.current = link(state, nextState.current);
      nextState.current = lastState.current;
    }
  }, [nextState, lastState, lastLinked, state, link]);

  const [_, rerender] = useReducer((prev: U, next: U) => {
    lastState.current = prev;
    nextState.current = next;
    return next;
  }, state);

  return [nextState.current, rerender] as [U, typeof rerender];
};

export const create = createStoreFromState();
