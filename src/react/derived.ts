import { useMemo, useRef, useState } from "react";
import { createBaseAtom, getValue, isPromiseLike } from "~/base/atom.ts";

export const useDerived = <T>(
  derived: T,
  options?: {
    comparator?: ({ next, prev }: { next: T; prev: T }) => boolean;
    link?: (source: T, local: T) => T;
  },
) => {
  const atomValue = (
    isPromiseLike(derived) ? getValue(derived) : derived
  ) as Awaited<T>;

  const comparator = useRef(options?.comparator).current;
  const link = useRef(options?.link).current;

  const lastLinkedState = useRef(atomValue);
  const [value, setAtom] = useState(atomValue);
  const atomRef = useRef(createBaseAtom(value, comparator, setAtom)).current;

  useMemo(() => {
    if (lastLinkedState.current !== atomValue && link) {
      atomRef.value = link(atomValue, atomRef.value) as Awaited<T>;
      lastLinkedState.current = atomValue;
    }
  }, [atomValue, lastLinkedState, atomRef, link]);

  return atomRef;
};
