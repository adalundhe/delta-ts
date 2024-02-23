import { Key, RefAttributes, useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Store } from './store';
import { AsyncFunction, GeneratorFunction } from './async';
import { MutationKey, StoreApi, StoreData, StoreMutation, StoreKey, StoreMutations, StoreValue, Atom } from './types';

const useStore = <T extends StoreApi<T>>(init: StoreApi<T>) => {
    const store = useRef(Store.init(init)).current;

    useSyncExternalStore(
        store.subscribe,
        store.getState
    )

    return store
}

const useWrappedState = <T extends StoreApi<T>>(
    store: Store<T>
) => {
    return useMemo(() => {
        const wrappedState: {
            [Key in StoreKey<T>]: T[Key]
        } = Object.create({})

        const state = store.getState()
    
        for (const key in state){
    
            const subsetSlice = state[key as keyof T] as T[keyof T];
            const nonValueKeys = Object.keys(subsetSlice as {}).filter(key => key !== 'value')
    
            for (const mutationKey of nonValueKeys){
    
                const mutation = subsetSlice[mutationKey as keyof T[keyof T]] as any;
        
                if ((mutation instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) === true){
                    const mutator = async (next: Parameters<typeof mutation>) => {
                        await store.createMutationAsync({
                            key: key as StoreKey<T>,
                            next: next as StoreValue<T>
                        })
    
                        return store.get(key)
                    }
    
                    wrappedState[mutationKey as keyof T] = mutator as T[keyof T]
                } else {
                    
                    const mutator = (next: Parameters<typeof mutation>) => {
                        store.createMutation({
                            key: key as StoreKey<T>,
                            next: next as StoreValue<T>
                        })
    
                        return store.get(key)
                    }
    
                    wrappedState[mutationKey as keyof T] = mutator as T[keyof T]
    
                }
            
            }
        }
        return wrappedState
    }, [])
}


const useSelector = <
    T extends StoreApi<T>
>(
    store: Store<T>,
    selector: (
        state:  {
            [Key in keyof T]: T[Key]
        }
    ) => {
        [Key in StoreKey<T>]: Partial<T[Key]>
    }
) => {

    const state = useWrappedState(store);
    return  useMemo(() => selector(state)  as {
        [Key in keyof T]: T[Key]
    }, [state])
}


const createImpl = <T extends StoreApi<T>>(init :T) => {

    const useCreatedStore = (
        selector: (
            state:  {
                [Key in keyof T]: T[Key]
            }
        ) => {
            [Key in StoreKey<T>]: Partial<T[Key]>
        }
    ) => {
        const store = useStore(init);
        return  useSelector(
            store,
            selector
        )
    } 

    return useCreatedStore
}


export const useAtom = <
    T extends Atom<T>,
    K extends T['value']
>(
    atom: T,
    select?: ({
        value
    }: {
        value: K
    }) => {
        value: K,
        update?: (next: K) => K
    }
) => {

    const { 
        value,
        update
     } = useMemo(() => select ? {
        ...select({
            value: atom.value
        } as {
            value: K,
            update?: (value: K) => K
        })
    } : {
        value: atom.value
    } as {
        value: K,
        update?: (value: K) => K
    }, [atom])

    const [atomValue, updateAtom] = useState<K>(value as K)

    return {
        value: atomValue as K,
        update: (value: K) => updateAtom(
            update ? update(value): value
        )
    }
}


const createAtomImpl = <
    T extends Atom<T>,
    K extends T['value']
>(atom: T) => {

    const useCreatedAtom = (
        select?: ({
            value
        }: {
            value: K
        }) => {
            value: K
        }
    ) => {
        return useAtom(
            {...atom},
            select
        )
    }

    return useCreatedAtom

}

export const atom = <T extends Atom<T>>(atom: T) => createAtomImpl(atom)
export const create = <T extends StoreApi<T>>(init: T) => createImpl(init)