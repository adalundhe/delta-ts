export interface StoreItem<S, V> {
    value: V;
    update: (prev: V) => (next: V) => V | ((prev: V) => (next: V) => Promise<V>)
}
