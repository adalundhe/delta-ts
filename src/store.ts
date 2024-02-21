import {StoreItem} from './store_item'

let listeners: Array<
    () => void
> = []


class Store<T extends {
    [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
}>{

    private state: {
        [Property in keyof T]: T[Property]['value']
    };
    private mutators: {
        [Property in keyof T]: (
            prev: T[Extract<keyof T, string>]['value']
        ) => (
            next: T[Extract<keyof T, string>]['value']
        ) => T[Extract<keyof T, string>]['value'] | (
        (
            prev: T[Extract<keyof T, string>]['value']
        ) => (
            next: T[Extract<keyof T, string>]['value']
        ) => Promise<T[Extract<keyof T, string>]['value']>)
    }

    private constructor(state: {
        [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
    }){
        this.state = Object.create({})
        this.mutators = Object.create({})
        for (const key in state){
            this.mutators[key] = state[key].update
            this.state[key] = state[key].value
        }

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

    getInitialState(){
        return this.state
    }
    
    get<
        K extends keyof T
    >(key: K){
        return this.state[key] as T[K]['value'];
    }

    mutate(next: Partial<{
        [Property in keyof T]: T[Property]['value']
    }>){
        for (const key in next){

            this.createMutation({
                key,
                next: next[key]
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
                    next: next[key]
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
                next: next[key]
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
                    next: next[key]
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
                next: transform
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
                    next: transform
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
                next: transform
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
                    next: transform
                }))
            }).flat() as Array<Promise<void>>
        ])

        return this.getState()

    }

    private createTransform<
        K extends keyof T
    >({
        key,
        next
    }: Partial<{
        key: K
        next: (
            prev: T[keyof T]['value']
        ) => T[keyof T]['value']
    }>){

        const prev = this.state[key as K];
        this.state  = {
            ...this.state,
            [key as K]: next ? next(prev) : prev
        }

        this.emitChange()
    }

    private async createTransformAsync<
        K extends keyof T
    >({
        key,
        next
    }: Partial<{
        key: K
        next: (
            prev: T[keyof T]['value']
        ) => T[keyof T]['value']
    }>){

        const prev = this.state[key as K];
        this.state  = {
            ...this.state,
            [key as K]: next ? await next(prev) : prev
        }

        this.emitChange()
    }

    private createMutation<
        K extends keyof T
    >({
        key,
        next
    }: Partial<{
        key: K
        next: T[K]['value']
    }>){
        const mutator = this.mutators[key as K];
        const prev = this.state[key as K];

        this.state  = {
            ...this.state,
            [key as K]: mutator(prev)(next)
        }

        this.emitChange()
    }

    private async createMutationAsync<
        K extends keyof T
    >({
        key,
        next
    }: Partial<{
        key: K
        next: T[K]['value']
    }>){
        const mutator = this.mutators[key as K];
        const prev = this.state[key as K];

        this.state  = {
            ...this.state,
            [key as K]: await mutator(prev)(next)
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
        return this.state;
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