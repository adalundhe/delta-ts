


export type StoreTransformSet<T> = Partial<Record<
    StoreKey<T>,
    StoreTransform<T>
>>;

export type StoreTransformSeries<T> = Partial<Record<
    StoreKey<T>,
    Array<StoreTransform<T>>
>>


export type StoreValue<T> = StoreData<T>[StoreKey<T>]





export type StoreTransform<T> = (prev: StoreValue<T>) => StoreValue<T>


export type StoreMutations<T> = Record<StoreKey<T>, StoreMutation<T>>



export type StoreApi<T> = T extends {
    [Property in keyof T]: {
        value: T[keyof T][keyof T[keyof T]],
        update: (prev: any) => (next: any) => any | ((prev: any) => (next: any) => Promise<any>)
    }
} ? T : never;


export type StoreKey<T> = keyof StoreApi<T>


export type StoreData<T> = Record<keyof StoreApi<T>, StoreApi<T>[StoreKey<T>]['value']>


export type StoreMutation<T> = (
    prev: StoreValue<T>
) => (
    next: StoreValue<T>
) => StoreValue<T> | (
(
    prev: StoreValue<T>
) => (
    next: StoreValue<T>
) => Promise<StoreValue<T>>)

