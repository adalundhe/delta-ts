import { createContext, useContext } from "react";
import { createBaseAtom, getValue } from "~/base/atom.ts";
import { Read } from "~/base/types.ts";

export const atom = <T>(creator: T | Read<T>) => {
  return createBaseAtom(getValue(creator));
};

type Store<T> = ReturnType<typeof createBaseAtom<T>>;

const AtomContext = createContext<Store<any> | undefined>(undefined);

export const useStore = <T>(options?: { store: Store<T> }): Store<T> => {
  const store = useContext(AtomContext);
  return options?.store || store || createBaseAtom<T>(undefined as T);
};
