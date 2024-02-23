import { Store } from "./store"


export type StoreItemWithValue<I, K extends keyof I, V extends I[K]> = {
    value: V
}

export type StoreItemWithMutators<I, K extends keyof I, V extends I[K]> = {
    [key: string]: (prev: V) => (next: any) => V | Promise<V>
}

export type StoreItem<I, K extends keyof I, V extends I[K]> = StoreItemWithValue<I, K, V> | StoreItemWithValue<I, K, V> & StoreItemWithMutators<I, K, V>


export type StoreApi<T extends {
    [Property in keyof T]: StoreItem<T[Property], keyof T[Property], T[Property]['value']>
}> = {
    [Property in keyof T]: T[Property] &  StoreItem<T[Property], keyof T[Property], T[Property]['value']>
};


export type StoreKey<T extends StoreApi<T>> = keyof StoreApi<T>
export type StoreValue<T extends StoreApi<T>> = StoreApi<T>[StoreKey<T>]['value']


export type StoreData<T extends StoreApi<T>> = Record<StoreKey<T>, StoreValue<T>>


export type StoreMutation<T extends StoreApi<T>, P> = StoreApi<T>[keyof T][MutationKey<T>] & (
    P extends (
        prev: StoreValue<T>
    ) => (
        next: StoreValue<T>
    ) => StoreValue<T> ?
    (
        prev: StoreValue<T>
    ) => (
        next: StoreValue<T>
    ) => StoreValue<T> 
    :
    (
        prev: StoreValue<T>
    ) => (
        next: StoreValue<T>
    ) => Promise<StoreValue<T>>
)


export type StoreTransformSet<T extends StoreApi<T>> = Partial<Record<
    StoreKey<T>,
    StoreTransform<T>
>>;

export type StoreTransformSeries<T extends StoreApi<T>> = Partial<Record<
    StoreKey<T>,
    Array<StoreTransform<T>>
>>

export type StoreTransform<T extends StoreApi<T>> = (prev: StoreValue<T>) => StoreValue<T> | Promise<StoreValue<T>>

export type MutationKey<T extends StoreApi<T>> = Exclude< keyof StoreApi<T>[keyof StoreApi<T>], 'value'>

export type StoreMutations<T extends StoreApi<T>> = Record<MutationKey<T>, StoreMutation<T, StoreApi<T>[keyof StoreApi<T>][MutationKey<T>]>>


export type Atom<T extends StoreApi<T>, Key extends keyof T> = StoreApi<T>[Key]
