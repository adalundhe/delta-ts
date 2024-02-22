import  { 
    StoreApi, 
    StoreData, 
    StoreMutations, 
    StoreKey,
    StoreValue,
    StoreTransform,
    StoreTransformSet,
    StoreTransformSeries,
    StoreItem
} from './types'

let listeners: Array<
    () => void
> = []


class Store<T extends {
    [Property in keyof T]: StoreItem<T[Property]['value']>
}>{

    private state: StoreData<T>;
    private mutators: StoreMutations<T>

    private constructor(state: StoreApi<T>){
        this.state = Object.create({})
        this.mutators = Object.create({})
        for (const key in state){

            this.mutators = Object.assign({}, this.mutators, {
                [key]: state[key].update
            })

            this.state = Object.assign({}, this.state, {
                [key]: state[key].value
            })

        }

    }
    
    static init<T extends {
        [Property in keyof T]: StoreItem<T[Property]['value']>
    }>(
        state: T
    ) {
        return new Store<
            T
        >(state as StoreApi<T>)
    }
    
    get<
        K extends keyof StoreData<T>
    >(key: K){
        return this.state[key];
    }

    mutate(next: Partial<StoreData<T>>){


        for (const cacheKey in next){

            const key = cacheKey as StoreKey<T>;
             if (key){
                this.createMutation({
                    key,
                    next: next[key] as StoreValue<T>
                })
            }
            
        }
        
    }

    async mutateAsync(next: Partial<StoreData<T>>){

        const keys = Object.keys(next) as Array<Extract<keyof T, string>>;

        await Promise.all([
            ...keys.map<Promise<void>>((key) => {
                return this.createMutationAsync({
                    key,
                    next: next[key] as StoreValue<T>
                })
            })
        ])   
        
    }

    transform(next: StoreTransformSet<T>){
        
        for (const key in next){
            this.createTransform({
                key,
                next: next[key] as StoreTransform<T>
            })
        }
        
    }

    async transformAsync(next: Partial<{
        [Property in keyof T]: (
            prev: T[Property][keyof T[Property]]
        ) => Promise<T[Property][keyof T[Property]]>
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
        
    }

    series(next: StoreTransformSeries<T>){
        for (const key in next){
            
            (next[key] ?? []).map(transform => this.createTransform({
                key,
                next: transform as StoreTransform<T>
            }))

        }
        
    }

    async seriesAsync(next: Partial<{
        [Property in keyof T]: Array<
            (
                prev: T[Property][keyof T[Property]]
            ) => Promise<T[Property][keyof T[Property]]>
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
        
    }

    norm({
        transforms
    }: {
        transforms: Array<StoreTransform<T>>
    }){

        const keys = Object.keys(this.state) as Array<Extract<keyof T, string>>;
        keys.map(key => {
            transforms.map(transform => this.createTransform({
                key,
                next: transform
            }))
        })
        
    }

    async normAsync({
        transforms
    }: {
        transforms: Array<
            (
                prev: T[keyof T][keyof T[keyof T]]
            ) => Promise<T[keyof T][keyof T[keyof T]]>
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

    }

    private createTransform({
        key,
        next
    }: {
        key: StoreKey<T>,
        next: StoreTransform<T>
    }){

        const prev = this.state[key];
        this.state  = {
            ...this.state,
            [key as Extract<keyof T, string>]: next ? next(
                prev
            ) : prev
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
            prev: T[keyof T][keyof T[keyof T]]
        ) => Promise<T[keyof T][keyof T[keyof T]]>
    }>){

        const prev = this.state[key as keyof T];
        this.state  = {
            ...this.state,
            [key as K]: next ? await next(
                prev as T[keyof T][keyof T[keyof T]]
            ) : prev
        }

        this.emitChange()
    }

    private createMutation({
        key,
        next
    }: {
        key: StoreKey<T>
        next: StoreValue<T>
    }){
        const mutator = this.mutators[key];
        const prev = this.state[key];

        this.state  = {
            ...this.state,
            [key as Extract<keyof T, string>]: mutator( 
                prev
            )(
                next
            )
        }

        this.emitChange()
    }

    private async createMutationAsync({
        key,
        next
    }: {
        key: StoreKey<T>
        next: StoreValue<T>
    }){
        const mutator = this.mutators[key];
        const prev = this.state[key as keyof T];

        this.state  = {
            ...this.state,
            [key as Extract<keyof T, string>]: await mutator(
                prev
            )(
                next
            )
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
        return this.state as {
            [Property in keyof T]: T[Property][keyof T[Property]]
        };
    }

    getMutators (){
        return this.mutators as StoreMutations<T>
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