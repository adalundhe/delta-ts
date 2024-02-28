import { createAtomApi } from "src/atom.ts";
import { Atom, Read } from "src/base/types.ts";


const createAsyncAtom = async <T>(
  creator: T | Read<Promise<T>>,
  comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
) => {

const createNextAtom = createAtomApi();
const atomStore = createNextAtom<T>({} as any);

const getState = (atom: Atom<T>): T =>  atom.get()

const asyncCreator = creator as  (
  get: (atom: Atom<T>) => T
) => Promise<T>

    const init = typeof creator === 'function' ? await asyncCreator(getState) : creator;
    atomStore.setState(init)

    const atom = {
      store: atomStore,
      get: () => atomStore.getState(),
      set: (next: T) => {
        const shouldUpdate = !comparator || comparator({
          next,
          prev: atomStore.getState()
        })

        if (shouldUpdate){
          atomStore.setState(next)
          atomStore.subscribers.forEach((callback) => {
            callback(next)
          })
        }
        
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

  return atom

};
  
  
export const atom = createAsyncAtom;