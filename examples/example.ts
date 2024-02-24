import { create, compare, atom } from "../src/react";


const useMyCustomStore = create({
  boop: {
    value: [] as number[],
    concat: (next: number[]) => async (prev: number[]) => prev.concat(next),
  },
  beep: {
    value: "",
    concat: (next: string) => (prev: string) => prev + next,
  }
})

const { boop } = useMyCustomStore((store) => ({
  beep: {
    value: store.beep.value
  }
}), ({ prev, next }) => compare({
  prev: prev.beep.value,
  next: next.beep.value,
  is: ({ prev, next }) => next.length > prev.length
}));


const useMyAtom = atom({
  value: boop.value,
  update: (value: number[]) => value.concat([0])
})

// const { value, update } = atom(boop)(({ value }) => ({
//   value: value.length > 0 ? value : [0, 1, 2, 3],
//   update: (next: number[]) => value.concat(next),
// }));

// update(value);
