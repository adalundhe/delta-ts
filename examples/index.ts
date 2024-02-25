import { Store } from "../src/store";

const store = Store.init({
  boop: {
    value: [] as number[],
    update: (prev: number[]) => (next: number[]) => prev.concat(next),
  },
});
