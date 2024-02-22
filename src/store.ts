import  { 
    StoreApi, 
    StoreData, 
    StoreMutations, 
    StoreKey,
    StoreValue,
    StoreTransform,
    StoreTransformSet,
    StoreTransformSeries,
    MutationKey
} from './types'

let listeners: Array<
    () => void
> = []


class Store<T extends StoreApi<T>>{

    private state: StoreData<T>;
    private mutators: StoreMutations<T>;
    private rawState: StoreApi<T>;
    private mutationKeyMap: {
        [Key in MutationKey<T>]: StoreKey<T>
    }

    private constructor(state: StoreApi<T>){
        this.state = Object.create({})
        this.mutators = Object.create({})
        this.rawState  = state;
        this.mutationKeyMap = Object.create({});

        for (const key in state){

            const subStore = state[key];

            const nonValueKeys = Object.keys(subStore).filter((key) => key !== 'value') as Array<MutationKey<T>>

            for (const mutationKey of nonValueKeys){
                const mutation = state[key][mutationKey]
                this.mutators = Object.assign({}, this.mutators, {
                    [mutationKey]: mutation
                })

                this.mutationKeyMap[mutationKey] = key;
       
            }

            this.state = Object.assign({}, this.state, {
                [key]: subStore.value
            })

        }

    }
    
    static init<T extends StoreApi<T>>(
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

    async transformAsync(next: StoreTransformSet<T>){

        const keys = Object.keys(next) as Array<StoreKey<T>>;

        await Promise.all([
            ...keys.map((key) => {
                return this.createTransformAsync({
                    key,
                    next: next[key] as StoreTransform<T>
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
        [Property in StoreKey<T>]: Array<
            (
                prev: StoreValue<T>
            ) => Promise<StoreValue<T>>
        >
    }>){

        const keys = Object.keys(next) as Array<StoreKey<T>>;

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
                prev: StoreValue<T>
            ) => Promise<StoreValue<T>>
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

        const prev = this.state[key] as StoreValue<T>;
        this.state  = {
            ...this.state,
            [key as StoreKey<T>]: next ? next(
                prev
            ) : prev
        }

        this.emitChange()
    }

    private async createTransformAsync({
        key,
        next
    }: {
        key: StoreKey<T>
        next: StoreTransform<T>
    }){

        const prev = this.state[key] as StoreValue<T>;
        this.state  = {
            ...this.state,
            [key]: next ? await next(
                prev
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
        const mutator = this.mutators[key]  as (prev: any) => (next: any) => any;
        const prev = this.state[key]  as StoreValue<T>;

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
        const mutator = this.mutators[key] as (
            prev: any
        ) => (next: any) => Promise<any>;
        const prev = this.state[key]  as StoreValue<T>;

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
        return this.rawState;
    }

    getMutationKey(key: MutationKey<T>){
        return this.mutationKeyMap[key]
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