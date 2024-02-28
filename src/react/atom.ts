import { Atom, Read, Listener } from "src/base/types.ts";
import { createAtomApi } from 'src/base/atom.ts'
import { useRef, useMemo, useSyncExternalStore } from "react";


const getValueFromCreator = <T>(
  creator: T | Read<T>
) => {

  const getState = (atom: Atom<T>): T =>  atom.get()
  const syncCreator = creator as  (
    get: (atom: Atom<T>) => T
  ) => T


  return typeof creator === 'function' ? syncCreator(getState) : creator;
}


const createAtom = <T>(
  creator: T | Read<T>
) => {
  const createNextAtom = createAtomApi();
  const atomStore = createNextAtom<T>({} as any);


  const init = getValueFromCreator(
    creator
  )
  atomStore.setState(init)
  
  return {
    store: atomStore,
    get: () => atomStore.getState(),
    set: (next: T) => {
      atomStore.setState(next)
      atomStore.subscribers.forEach((callback) => {
        callback(next)
      })
      
    },
    subscribe: (
      callback: (next: T) => void,
      callbackComparator?: ({
        next,
        prev
      }:{
        next: T,
        prev: T
      }) => boolean
    ) => {

      if (callbackComparator){
        const currentState = atomStore.getState()
    
        atomStore.subscribers.add((state) => callbackComparator({
          next: state as T,
          prev: currentState as any
        }) && callback(state as T));

      } else {
        atomStore.subscribers.add(
          callback as (state: any) => void
        );
      }
    }
  } as Atom<T>

}


export const useAtom = <T>(
  creator: T | Read<T>,
  link?: (source: T, local: T) => T,
) => {

  const atomRef = useRef(createAtom<T>(creator)).current;
  const lastLinkedState = useRef(
    getValueFromCreator(creator)
  );

  const creatorValue = getValueFromCreator(creator)

  useMemo(() => {
    if (lastLinkedState.current !== atomRef && link) {
      lastLinkedState.current = creatorValue;
      atomRef.store.value = link(lastLinkedState.current, atomRef.store.value);
    }
  }, [creatorValue, atomRef, link]);

  const value = useSyncExternalStore(
    (callback: Listener<T>) => atomRef.store.subscribe(callback),
    () => atomRef.get(),
    () => atomRef.store.value,
  )
  atomRef.store.value = value
    
  return atomRef

};
