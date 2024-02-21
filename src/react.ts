import { useRef, useSyncExternalStore } from 'react';
import { Store } from './store';
import { StoreApi } from './types';

export const useStore = <T>(init: StoreApi<T>) => {
    const store = useRef(Store.init(init))

    useSyncExternalStore(
        store.current.subscribe,
        store.current.getState
    )
   

    return store.current
}
