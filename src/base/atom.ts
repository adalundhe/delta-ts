import { Atom, Listener, Read } from "./types.ts";

export const isPromiseLike = (x: unknown): x is PromiseLike<unknown> =>
  typeof (x as any)?.then === "function";

export const use = <T>(
  promise: PromiseLike<T> & {
    status?: "pending" | "fulfilled" | "rejected";
    value?: T;
    reason?: unknown;
  },
): T => {
  if (promise.status === "pending") {
    throw promise;
  } else if (promise.status === "fulfilled") {
    return promise.value as T;
  } else if (promise.status === "rejected") {
    throw promise.reason;
  } else {
    promise.status = "pending";
    promise.then(
      (v) => {
        promise.status = "fulfilled";
        promise.value = v;
      },
      (e) => {
        promise.status = "rejected";
        promise.reason = e;
      },
    );
    throw promise;
  }
};

const isGetter = <T>(x: unknown): x is Read<T> => typeof x === "function";

export const getValue = <T>(getState: T | Read<T>): T => {
  if (isPromiseLike(getState)) {
    return use(getState) as Awaited<T>;
  } else if (isGetter<T>(getState)) {
    return getState(<V>(atom: Atom<V>): V => atom.get());
  } else {
    return getState;
  }
};

export const createBaseAtom = <T>(
  get: T | Read<T>,
  comparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
  setter?: (value: T) => void,
) => {
  const atom = {
    value: get,
    subscribers: new Set<Listener<T>>(),
    get(next?: T | Read<T>) {
      return next ? getValue(next) : getValue(this.value);
    },
    set(next: T | Read<T>) {
      const value = getValue(next) as unknown as Awaited<T>;
      const shouldUpdate =
        !comparator ||
        comparator({
          next: value,
          prev: getValue(this.value),
        });

      if (shouldUpdate) {
        this.value = value;

        setter && setter(this.value);
        this.subscribers.forEach((callback) => {
          callback(value);
        });
      }
    },
    subscribe(
      callback: (next: T) => void,
      callbackComparator?: ({ next, prev }: { next: T; prev: T }) => boolean,
    ) {
      if (callbackComparator) {
        const subscribers = this.subscribers.add(
          (state) =>
            callbackComparator({
              next: state as T,
              prev: getValue(this.value),
            }) && callback(state as T),
        );

        return () =>
          subscribers.forEach((callback) => {
            callback({});
          });
      } else {
        const subscribers = this.subscribers.add(
          callback as (state: any) => void,
        );
        return () =>
          subscribers.forEach((callback) => {
            callback({});
          });
      }
    },
  } as Atom<T>;

  return atom;
};

export const atom = createBaseAtom;
