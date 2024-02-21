import { Store } from './store'
import { useSyncExternalStore } from "react";


export const useStore = <
T extends {
    [Property in keyof T]: T[Property]
}>(store: Store<T>) => {
    return useSyncExternalStore(
        store.subscribe,
        store.getState
    )
}

