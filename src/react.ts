import { Key, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { Store } from './store';
import { StoreApi, StoreData, StoreKey, StoreItem, StoreValue, StoreMutations } from './types';

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


const useStoreSelection = <T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}>(
    store: Store<T>,
    key: keyof T
) => {

    const storeState = store.getState();
    const storeMutators = store.getMutators();

    const state = useMemo(() => storeState[key], [storeState]);
    const mutator = useMemo(() => storeMutators[key], [storeMutators]);

    return {
        key: state,
        update: mutator
    }
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

    }, [state])

    return useMemo(() => selector(state, mutators), [mutators])
}


const store = useStore({
    boop: {
        value: [] as number[],
        update: (prev: number[]) => (next: number[]) => prev.concat(next)
    },
    beep: {
        value: 1,
        update: (prev: number) => (next: number) => prev + next
    }
})


const {
    beep
} = useSelector(
    store,
    (state, mutations) => ({
        beep: {
            value: state.beep,
            update: mutations.beep
        }
    })
)

beep.update({beep: 1})