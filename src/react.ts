import { Key, useMemo, useRef, useSyncExternalStore } from 'react';
import { Store } from './store';
import { AsyncFunction, GeneratorFunction } from './async';
import { MutationKey, StoreApi, StoreData, StoreMutation, StoreKey, StoreMutations, StoreValue } from './types';

export const useStore = <T extends StoreApi<T>>(init: StoreApi<T>) => {
    const store = useRef(Store.init(init)).current;

    useSyncExternalStore(
        store.subscribe,
        store.getState
    )

    return store
}

export const useSelector = <
    T extends StoreApi<T>
>(
    store: Store<T>,
    selector: (
        state:  {
            [Key in keyof T]: T[Key]
        }
    ) => {
        [Key in StoreKey<T>]: T[Key]
    }
) => {

    const state = useMemo(() => store.getState(), [])
    return useMemo(() => {

        const slice = selector(state as StoreApi<T>);
        const wrappedState: {
            [Key in StoreKey<T>]: T[Key]
        } = Object.create({})

        const nonValueKeys = Object.keys(slice).filter(key => key !== 'value')

        for (const key of nonValueKeys){

            const mutation = slice[key as keyof T] as StoreMutation<T, typeof slice[keyof T]>;
            const storeKey = store.getMutationKey(key as MutationKey<T>);

            if ((mutation instanceof AsyncFunction && AsyncFunction !== Function && AsyncFunction !== GeneratorFunction) === true){
                const mutator = async (next: Parameters<typeof mutation>) => {
                    await store.mutateAsync({
                        [storeKey]: next
                    } as Partial<StoreData<T>>)

                    return store.get(storeKey)
                }

                wrappedState[key as keyof T] = mutator as T[keyof T]
            } else {
                
                const mutator = (next: Parameters<typeof mutation>) => {
                    store.mutateAsync({
                        [storeKey]: next
                    } as Partial<StoreData<T>>)

                    return store.get(storeKey)
                }

                wrappedState[key as keyof T] = mutator as T[keyof T]

            }
        
        }

        return {
            ...slice,
            ...wrappedState
        }

    }, [state])
}

