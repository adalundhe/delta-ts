import {
  ReducerWithoutAction,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { isPromiseLike, use } from "~/base/atom.ts";
import { Atom } from "~/base/types.ts";
import { useStore } from "./context.ts";

const useGetAtomStore = <T>(atom: Atom<T>) => {
  const store = useStore<T>();

  const [[value, _], rerender] = useReducer<
    ReducerWithoutAction<readonly [T, Atom<T>]>,
    undefined
  >(
    (prev) => {
      const nextValue = atom.get();
      if (Object.is(prev[0], nextValue) && prev[1] === atom) {
        return prev;
      }
      return [nextValue, atom];
    },
    undefined,
    () => [store.get(), atom],
  );

  useEffect(() => {
    const unsub = atom.subscribe(() => {
      rerender();
    });
    return unsub;
  }, [atom]);

  return isPromiseLike(value) ? use(value) : (value as Awaited<T>);
};

const useSetAtomStore = <T>(atom: Atom<T>) => {
  const setAtom = useCallback(
    (next: T) => {
      next !== atom.get() && atom.set(next);
    },
    [atom],
  );
  return setAtom;
};

export const useAtomStore = <T>(atom: Atom<T>) => {
  return [useGetAtomStore(atom), useSetAtomStore(atom)] as [
    T,
    (value: T) => void,
  ];
};

export const useProxy = <V>(atom: Atom<V>) => {
  type ValueType = V extends PromiseLike<any> ? Awaited<V> : V;
  type ProxyType = {
    value: ValueType;
  };

  useAtomStore(atom);

  return useRef(
    new Proxy(
      {
        value: atom.get(),
      } as ProxyType extends {
        value: ValueType;
      }
        ? ProxyType
        : any,
      {
        get() {
          return atom.get();
        },
        set(
          target: ProxyType,
          props: string,
          value: ProxyType[keyof ProxyType],
          _: any,
        ) {
          if (atom.get() !== value) {
            target[props as keyof ProxyType] = value;
            atom.set(value);
          }
          return true;
        },
      },
    ),
  ).current as {
    value: ValueType;
  };
};

export const useAtom = <T>(atom: Atom<T>) => {
  useAtomStore(atom);
  const atomRef = useRef(atom).current;

  return atomRef as T extends PromiseLike<any> ? Atom<Awaited<T>> : Atom<T>;
};
