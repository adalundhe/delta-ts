import { AsyncFunction, GeneratorFunction } from "./async";
import {
  MutationKey,
  StoreApi,
  StoreData,
  StoreKey,
  StoreMutations,
  StoreValue,
} from "./types";

class Store<T extends StoreApi<T>> {
  private state: StoreData<T>;
  private mutators: StoreMutations<T>;
  private store: StoreApi<T>;
  private assembled: StoreApi<T>;
  private mutationKeyMap: {
    [Key in MutationKey<T>]: StoreKey<T>;
  };
  private subscribers: Set<() => void>;

  constructor(state: StoreApi<T>) {
    this.state = Object.create({});
    this.mutators = Object.create({});
    this.store = state;
    this.assembled = Object.create({});
    this.mutationKeyMap = Object.create({});
    this.subscribers = new Set();

    for (const key in state) {
      const subStore = state[key];
      const nonValueKeys = Object.keys(subStore).filter(
        (key) => key !== "value",
      ) as Array<MutationKey<T>>;

      this.assembled[key] = Object.create({ ...subStore });

      for (const mutationKey of nonValueKeys) {
        const mutator = state[key][
          mutationKey
        ] as StoreMutations<T>[typeof mutationKey];
        this.mutators[mutationKey] = mutator;

        if (
          (mutator instanceof AsyncFunction &&
            AsyncFunction !== Function &&
            AsyncFunction !== GeneratorFunction) === true
        ) {
          const assembledMutation = async (next: StoreValue<T, keyof T>) => {
            const { value } = this.assembled[key];
            const mutation =
              this.mutators[mutationKey as unknown as MutationKey<T>];

            const nextVal = (await mutation(next)(
              value as StoreValue<T, keyof T>,
            )) as typeof value;

            this.assembled[key] = Object.assign(this.assembled[key], {
              value: nextVal,
            });
            this.assembled = Object.assign({}, this.assembled);

            this.subscribers.forEach((callback) => callback());

            return nextVal;
          };

          this.assembled[key][mutationKey] =
            assembledMutation as StoreApi<T>[Extract<
              keyof T,
              string
            >][MutationKey<T>];
        } else {
          const assembledMutation = (next: StoreValue<T, keyof T>) => {
            const { value } = this.assembled[key];
            const mutation =
              this.mutators[mutationKey as unknown as MutationKey<T>];

            const nextVal = mutation(next)(
              value as StoreValue<T, keyof T>,
            ) as typeof value;

            this.assembled[key] = Object.assign(this.assembled[key], {
              value: nextVal,
            });
            this.assembled = Object.assign({}, this.assembled);

            this.subscribers.forEach((callback) => callback());

            return nextVal;
          };

          this.assembled[key][mutationKey] =
            assembledMutation as StoreApi<T>[Extract<
              keyof T,
              string
            >][MutationKey<T>];
        }

        this.mutationKeyMap[mutationKey] = key;
      }

      this.state = Object.assign({}, this.state, {
        [key]: subStore.value,
      });
    }

    this.store = {
      ...this.store,
      ...this.assembled,
    };
  }

  static init<T extends StoreApi<T>>(state: T) {
    return new Store<T>(state as StoreApi<T>);
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getStore() {
    return this.assembled;
  }
}

export { Store };
