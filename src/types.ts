export type StoreItemWithValue<I, K extends keyof I, V extends I[K]> = {
  value: V;
};

export type StoreItemWithMutators<I, K extends keyof I, V extends I[K]> = {
  [key: string]: (next: V) => (prev: any) => V | Promise<V>;
};

export type StoreItem<I, K extends keyof I, V extends I[K]> =
  | StoreItemWithValue<I, K, V>
  | (StoreItemWithValue<I, K, V> & StoreItemWithMutators<I, K, V>);

export type StoreApi<
  T extends {
    [Property in keyof T]: StoreItem<
      T[Property],
      keyof T[Property],
      T[Property]["value"]
    >;
  },
> = {
  [Property in keyof T]: T[Property] &
    StoreItem<T[Property], keyof T[Property], T[Property]["value"]>;
};

export type StoreKey<T extends StoreApi<T>> = keyof StoreApi<T>;
export type StoreValue<
  T extends StoreApi<T>,
  K extends keyof T,
> = StoreApi<T>[K]["value"];

export type StoreData<T extends StoreApi<T>> = Record<
  StoreKey<T>,
  StoreValue<T, keyof T>
>;

export type StoreMutation<
  T extends StoreApi<T>,
  K extends keyof T,
  M extends Exclude<keyof StoreApi<T>[K], "value">,
  P,
> = StoreApi<T>[K][M] &
  (P extends (
    next: StoreValue<T, K>,
  ) => (prev: StoreValue<T, K>) => StoreValue<T, K>
    ? (next: StoreValue<T, K>) => (prev: StoreValue<T, K>) => StoreValue<T, K>
    : (
        next: StoreValue<T, K>,
      ) => (prev: StoreValue<T, K>) => Promise<StoreValue<T, K>>);

export type StoreTransformSet<T extends StoreApi<T>> = Partial<
  Record<StoreKey<T>, StoreTransform<T, keyof T>>
>;

export type StoreTransformSeries<T extends StoreApi<T>> = Partial<
  Record<StoreKey<T>, Array<StoreTransform<T, keyof T>>>
>;

export type StoreTransform<T extends StoreApi<T>, K extends keyof T> = (
  prev: StoreValue<T, K>,
) => StoreValue<T, K> | Promise<StoreValue<T, K>>;

export type MutationKey<T extends StoreApi<T>> = Exclude<
  keyof StoreApi<T>[keyof StoreApi<T>],
  "value"
>;

export type StoreMutations<T extends StoreApi<T>> = Record<
  MutationKey<T>,
  StoreMutation<
    T,
    keyof T,
    Exclude<keyof T[keyof T], "value">,
    StoreApi<T>[keyof T][Exclude<keyof T[keyof T], "value">]
  >
>;



export type AtomStore<T> = {
  value: T[Exclude<keyof T, 'update'>];
  update: AtomMutation<T[Exclude<keyof T, 'update'>], T[Exclude<keyof T, 'value'>]>
};

export type MutationRequest<
  T extends StoreApi<T>,
  K extends keyof T,
> = Partial<{
  [Key in StoreKey<T>]: Partial<{
    [Mutation in MutationKey<T>]: StoreValue<T, K>;
  }>;
}>;

export type Listener = () => void;


export type AtomMutation<
  V,
  P,
> = P extends (set: (next: V) => V) => (next: V) => V
    ? (set: (next: V) => V) => (next: V) => V
    : (
      (set: (next: V) => V) => (next: V) => Promise<V>
    )


export type Mutation<
  T extends StoreApi<T>,
  K extends keyof T,
  M extends Exclude<keyof StoreApi<T>[K], "value">,
  P,
> = StoreApi<T>[K][M] &
  (P extends (
    set: (state: StoreValue<T, K>) => StoreValue<T, K>,
  ) => (next: StoreValue<T, K>) => StoreValue<T, K>
    ? (set: (state: StoreValue<T, K>) => StoreValue<T, K>) => (next: StoreValue<T, K>) => StoreValue<T, K>
    : (
        set: (state: StoreValue<T, K>) => StoreValue<T, K>
      ) => (next: StoreValue<T, K>) => Promise<StoreValue<T, K>>);


export type AssembledMutation<
  T extends StoreApi<T>,
  K extends keyof T,
  M extends Exclude<keyof StoreApi<T>[K], "value">,
  P,
> = StoreApi<T>[K][M] &
  (P extends (next: StoreValue<T, K>) => StoreValue<T, K>
    ? (next: StoreValue<T, K>) => StoreValue<T, K>
    : (next: StoreValue<T, K>) => Promise<StoreValue<T, K>>);