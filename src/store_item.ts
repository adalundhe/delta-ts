export type StoreItem<
  S extends {
    [Property in keyof S]: S[Property];
  },
> = {
  [key: string]:
    | S[keyof S]
    | ((prev: S[keyof S]) => (next: S[keyof S]) => S[keyof S])
    | ((prev: S[keyof S]) => (next: S[keyof S]) => Promise<S[keyof S]>);
};
