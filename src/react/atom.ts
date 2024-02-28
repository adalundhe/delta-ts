import { useCallback, useMemo, useRef, useState, Dispatch, SetStateAction } from "react";
import { createAtomApi, getValueFromCreator } from "~/base/atom.ts";
import { Atom, Listener, Read } from "~/base/types.ts";



const createAtom = <T>(creator: T | Read<T>, setter?: Dispatch<SetStateAction<T>>) => {
  const createNextAtom = createAtomApi();
  const atomStore = createNextAtom<T>({} as any);

  const init = getValueFromCreator(creator);
  atomStore.setState(init);

  return {
    store: atomStore,
    get: (transform?: Read<T>) => transform ? getValueFromCreator(transform) : atomStore.getState(),
    set: (next: T | Read<T>) => {

      const value = getValueFromCreator(next)
      atomStore.setState(value);
      setter && setter(value)
      atomStore.subscribers.forEach((callback: Listener<T>) => {
        callback(value);
      });
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
};

export const useAtom = <T>(
  creator: T | Read<T>,
  link?: (source: T, local: T) => T,
) => {

  const creatorValue = useMemo(() => getValueFromCreator(creator), [creator]);
  const lastLinkedState = useRef(creatorValue);
  const linkFn = link ? useCallback((source: T, local: T) => link(source, local), [link]) : undefined
  
  const [_, setState] = useState(creatorValue);

  const atomRef = useRef(createAtom<T>(
    creator, 
    setState
  )).current;


  useMemo(() => {
    if (lastLinkedState.current !== creatorValue && linkFn) {

      atomRef.store.value = linkFn(creatorValue, atomRef.store.value);

      lastLinkedState.current = creatorValue;

    }
  }, [creatorValue, lastLinkedState, atomRef, linkFn]);

  return atomRef;
};
