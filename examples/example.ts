import { create, compare, atom, useAtom } from "../src";

interface Store {
  numbers: number[]
  appendToNumbers: (next: number[]) => void
}

const useMyCustomStore = create<Store>((set) => ({
    numbers: [],
    appendToNumbers: (next: number[]) => set({
      numbers: next
    })
}));

const { nums, append } = useMyCustomStore(
  ({ numbers, appendToNumbers }) => ({
    nums: numbers,
    append: appendToNumbers
  }),
  ({ prev, next }) =>
    compare({
      prev: prev.nums,
      next: next.nums,
      is: ({ prev, next }) => next.length > prev.length,
    }),
);

const useMyAtom = atom<typeof nums>(
  nums,
  (set) => async (next: number[]) => set(next),
);

const [value, update] = useMyAtom((state) => state);

console.log(update(value));

const test = (set) => async (next: string) => set(next);

const [myValue, setState] = useAtom(
  nums,
  (set) => async (next: number[]) => set(next),
);
