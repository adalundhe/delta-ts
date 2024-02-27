import { Atom, Store } from "./types.ts";

export const useSyncExternalStoreWithSelectorAsync = <Snapshot, Selection>(
  store: Store<Snapshot>,
  selector: (snapshot: Snapshot) => Selection,
  comparator?: (a: Selection, b: Selection) => boolean,
) => {
  const callback = (next: Snapshot) => {
    const requestedUpdate = {
      ...store.getState(),
      ...(next ? next : {}),
    };
    const currentState = selector(store.getState());
    const nextState = selector(requestedUpdate);
    const shouldUpdate = comparator
      ? comparator(currentState, nextState)
      : true;

    shouldUpdate &&
      store.setState({
        next: requestedUpdate,
      });
  };

  store.subscribe(callback as any);
  return selector(store.getState());
};

export const useSyncExternalAtomWithSelectorAsync = <Snapshot, Selection>(
  store: Atom<Snapshot>,
  selector: (snapshot: Snapshot) => Selection,
  comparator?: (a: Selection, b: Selection) => boolean,
) => {
  const callback = (next: Snapshot) => {
    const currentState = selector(store.getState());
    const nextState = selector(next);
    const shouldUpdate = comparator
      ? comparator(currentState, nextState)
      : true;

    shouldUpdate && store.setState(next);
  };

  store.subscribe(callback as any);
  return selector(store.getState());
};
