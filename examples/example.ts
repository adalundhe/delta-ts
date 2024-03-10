import { link } from "fs";
import { create } from "../src";

interface Store {
  counter: number;
  add: () => void;
}

const useMyCustomStore = create<Store>((set, get) => ({
  counter: 0,
  add: () =>
    set({
      counter: get().counter + 1,
    }),
}));

const { counter, add } = useMyCustomStore(
  ({ counter, add }) => ({
    counter,
    add,
  }),
  ({ next, prev }) => next.counter == prev.counter + 1,
);
