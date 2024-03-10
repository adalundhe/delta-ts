import { createContext, useContext } from "react";
import { createBaseStore, getValue } from "~/base/store.ts";
import { Read } from "~/base/types.ts";

export const atom = <T>(creator: T | Read<T>) => {
  return createBaseStore(getValue(creator));
};

type Store<T> = ReturnType<typeof createBaseStore<T>>;

const AtomContext = createContext<Store<any> | undefined>(undefined);

export const useStore = <T>(options?: { store: Store<T> }): Store<T> => {
  const store = useContext(AtomContext);
  return options?.store || store || createBaseStore<T>(undefined as T);
};
