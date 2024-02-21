import {StoreItem} from './store_item'

let listeners: Array<
    () => void
> = []


class Store<T extends {
    [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
}>{

    private state: {
        [Property in keyof T]:  StoreItem<T, T[Property]['value']>
    };
    private constructor(state: {
        [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
    }){

        this.state = state;
    }
    
    static init<
        T extends {
        [Property in keyof T]: T[Property]
    }>(
        state: T
    ) {
        return new Store<
            T
        >(state)
    }
    
    get<
        K extends keyof T
    >(key: K){
        return this.state[key].value as T[K]['value'];
    }

    mutate(next: Partial<{
        [Property in keyof T]: T[Property]['value']
    }>){
        for (const key in next){

            this.createMutation({
                key,
                next: next[key],
                prev: this.state[key]['value']
            })
            
        }

        return this.getState()
    }

    async mutateAsync(next: Partial<{
        [Property in keyof T]: T[Property]['value']
    }>){

        const keys = Object.keys(next) as Array<keyof T>;

        await Promise.all([
            ...keys.map<Promise<void>>((key) => {
                return this.createMutationAsync({
                    key,
                    next: next[key],
                    prev: this.state[key]['value']
                })
            })
        ])
        
        return this.getState()
    }

    transform(next: Partial<{
        [Property in keyof T]: (
            prev: T[Property]['value']
        ) => T[Property]['value']
    }>){
        
        for (const key in next){
            this.createTransform({
                key,
                next: next[key],
                prev: this.state[key]['value']
            })
        }

        return this.getState()
    }

    async transformAsync(next: Partial<{
        [Property in keyof T]: (
            prev: T[Property]['value']
        ) => Promise<T[Property]['value']>
    }>){

        const keys = Object.keys(next) as Array<keyof T>;

        await Promise.all([
            ...keys.map((key) => {
                return this.createTransformAsync({
                    key,
                    next: next[key],
                    prev: this.state[key]['value']
                })
            })
        ])

        return this.getState()
        
    }

    series(next: Partial<{
        [Property in keyof T]: Array<(
            prev: T[Property]['value']
        ) => T[Property]['value']>
    }>){
        for (const key in next){
            
            (next[key] ?? []).map(transform => this.createTransform({
                key,
                next: transform,
                prev: this.state[key]['value']
            }))

        }

        return this.getState()
    }

    async seriesAsync(next: Partial<{
        [Property in keyof T]: Array<
            (
                prev: T[Property]['value']
            ) => Promise<T[Property]['value']>
        >
    }>){

        const keys = Object.keys(next) as Array<keyof T>;

        await Promise.all([
            ...keys.map((key) => {

                return (next[key] ?? []).map(transform => this.createTransformAsync({
                    key,
                    next: transform,
                    prev: this.state[key]['value']
                }))

            }).flat() as Array<Promise<void>>
        ])


        return this.getState()
        
    }

    norm({
        transforms
    }: {
        transforms: Array<
            (
                prev: T[keyof T]['value']
            ) => T[keyof T]['value']
        >
    }){

        const keys = Object.keys(this.state) as Array<keyof T>;
        keys.map(key => {
            transforms.map(transform => this.createTransform({
                key,
                next: transform,
                prev: this.state[key]['value']
            }))
        })

        return this.getState()
    }

    async normAsync({
        transforms
    }: {
        transforms: Array<
            (
                prev: T[keyof T]['value']
            ) => Promise<T[keyof T]['value']>
        >
    }){
        const keys = Object.keys(this.state) as Array<keyof T>;

        await Promise.all([
            ...keys.map((key) => {
                return transforms.map(transform => this.createTransformAsync({
                    key,
                    next: transform,
                    prev: this.state[key]['value']
                }))
            }).flat() as Array<Promise<void>>
        ])

        return this.getState()

    }

    private createTransform<
        K extends keyof T
    >({
        key,
        next,
        prev
    }: Partial<{
        key: K
        next: (
            prev: T[keyof T]['value']
        ) => T[keyof T]['value']
        prev: T[K]['value']
    }>){

        const segment = {
            ...this.state[key as K],
            value: next ? next(prev) : prev
        }

        this.state  = {
            ...this.state,
            [key as K]: segment
        }

        this.emitChange()
    }

    private async createTransformAsync<
        K extends keyof T
    >({
        key,
        next,
        prev
    }: Partial<{
        key: K
        next: (
            prev: T[keyof T]['value']
        ) => T[keyof T]['value']
        prev: T[K]['value']
    }>){

        const segment = {
            ...this.state[key as K],
            value: next ? await next(prev) : prev
        }

        this.state  = {
            ...this.state,
            [key as K]: segment
        }

        this.emitChange()
    }

    private createMutation<
        K extends keyof T
    >({
        key,
        next,
        prev
    }: Partial<{
        key: K
        next: T[K]['value'],
        prev: T[K]['value']
    }>){
        const segment = {
            ...this.state[key as K],
            value: this.state[key as K].update(prev)(next)
        }

        this.state  = {
            ...this.state,
            [key as K]: segment
        }

        this.emitChange()
    }

    private async createMutationAsync<
        K extends keyof T
    >({
        key,
        next,
        prev
    }: Partial<{
        key: K
        next: T[K]['value'],
        prev: T[K]['value']
    }>){
        const segment = {
            ...this.state[key as K],
            value: await this.state[key as K].update(prev)(next)
        }

        this.state  = {
            ...this.state,
            [key as K]: segment
        }

        this.emitChange()
    }

    subscribe(listener: (() => void)) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }

    getState() {

        const state: {
            [Property in keyof T]:  T[Property]['value']
        } = Object.assign({})

        for (const key in this.state){
            state[key] = this.state[key].value

        }

        return state;
    }

    private emitChange() {
        for (let listener of listeners) {
            listener();
        }
    }

}

export {
    Store
}