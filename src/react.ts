import { Store } from './store'
import { StoreItem } from './store_item';
import { useSyncExternalStore } from "use-sync-external-store/shim";
import useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector';


const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;


const createStore = <
T extends {
    [Property in keyof T]: T[Property]
}>(state: T) => {
    return Store.init(state)
}


export const useStore = <
T extends {
    [Property in keyof T]: T[Property]
}>(store: Store<T>) => {
    return useSyncExternalStore(
        store.subscribe,
        store.getState
    )
}



export const useMemoizedStore = <T extends {
    [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
}>(
    store: Store<T>,
    selector: <K extends {
        [Property in keyof T]: T[Property]['value']
    }>(state: K) => Partial<K>,
    comparator: <K extends {
        [Property in keyof T]: T[Property]['value']
    }>(prev: Partial<K>, next: Partial<K>) => boolean
) => {
    return useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        store.getInitialState,
        selector,
        comparator
    )
}