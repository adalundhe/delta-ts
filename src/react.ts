import { useMemo, useRef, useSyncExternalStore } from 'react';
import { Store } from './store';
import { StoreApi, StoreData, StoreItem } from './types';

export const useStore = <T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}>(init: StoreApi<T>) => {
    const store = useRef(Store.init(init)).current;

    useSyncExternalStore(
        store.subscribe,
        store.getState
    )

    return store
}


export const useSelector = <T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}, K extends keyof T
>(
    store: Store<T>,
    selector: (
        state:  {
            [Property in keyof StoreApi<T>]: StoreApi<T>[Property]['value']
        },
        mutations: {
            [Property in keyof StoreApi<T>]: (
                next: Partial<StoreData<T>>
            ) => void
        }
    ) => Pick<{
        [Property in keyof StoreApi<T>]: {
            value: StoreApi<T>[keyof StoreApi<T>]['value'],
            update: (
                next: Partial<StoreData<T>>
            ) => void
        }
    }, K>
) => {

    const state = store.getState()

    const mutators = useMemo(() => {

        const mutationSet: {
            [Key in keyof StoreApi<T>]: (next: Partial<StoreData<T>>) => void
        } = Object.create({});

        for (const key in state){
            const mutation = (next: Partial<StoreData<T>>) => store.mutate(next);
            mutationSet[key] = mutation
        }

        return mutationSet

    }, [])

    return useMemo(() => selector(state, mutators), [mutators])
}

