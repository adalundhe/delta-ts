import { createAsync, atomAsync } from "../src";

interface CounterStore {
  count: number;
  updateCount: (next: number) => void;
  getCount: () => number;
}

const test = async () => {
  const asyncStore = await createAsync<CounterStore>(async (set, get) => ({
    count: 0,
    updateCount: (next: number) =>
      set({
        count: next + get().count,
      }),
    getCount: () => get().count,
  }));

  const { count, updateCount, getCount } = asyncStore((state) => state);

  updateCount(1);
  updateCount(1);

  const updatedCount = getCount();

  console.log(updatedCount);

  const { get, set, subscribe } = asyncStore((state) => state);

  subscribe(({ count }) => {
    console.log(count);
  });

  set({ count: get().count + 1 });

  const myAsyncAtom = await atomAsync<number>(async (set, get) => [
    count,
    (next) => set(next + get()),
  ]);

  const [, add, ,, subscribeAtom] = myAsyncAtom((value) => value);

  subscribeAtom((next) => {
    console.log(next);
  }, ({ next, prev }) => next > prev);

  add(1);
};

test();
