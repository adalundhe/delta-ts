


export type StoreTransformSet<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = Partial<Record<
    StoreKey<T>,
    StoreTransform<T>
>>;

export type StoreTransformSeries<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = Partial<Record<
    StoreKey<T>,
    Array<StoreTransform<T>>
>>

export type StoreTransform<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = (prev: StoreValue<T>) => StoreValue<T>


export type StoreMutations<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = Record<StoreKey<T>, StoreMutation<T>>

export interface StoreItem<V> {
    value: V,
    update: (prev: V) => (next: any) => V
}

export type StoreApi<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = {
    [Property in keyof T]: T[Property] & StoreItem<T[Property]['value']>
};


export type StoreKey<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = keyof StoreApi<T>


export type StoreData<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = Record<keyof StoreApi<T>, StoreApi<T>[StoreKey<T>]['value']>


export type StoreValue<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = StoreData<T>[StoreKey<T>]


export type StoreMutation<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}> = (
    prev: StoreValue<T>
) => (
    next: StoreValue<T>
) => StoreValue<T> | (
(
    prev: StoreValue<T>
) => (
    next: StoreValue<T>
) => Promise<StoreValue<T>>)

