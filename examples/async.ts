import { createAsync } from "../src";

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


  const { get, set, subscribe } = asyncStore((state) => state);

  subscribe(
    ({ count }) => {
      console.log(count);
    }, 
    ({ next, prev }) => next.count > prev.count + 10
  );

  set({ count: get().count + 100 });

};

test();
