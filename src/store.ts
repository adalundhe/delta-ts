import {StoreItem} from './store_item'

let listeners: Array<
    () => void
> = []


class Store<T extends {
    [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
}>{
    private keys: {
        [Property in keyof T]: {
            key: Extract<keyof T, string>
        }
    }
    private state: WeakMap<
        {

            key: Extract<keyof T, string>
        },
        StoreItem<T, T[Extract<keyof T, string>]['value']>
    >;
    private constructor(state: {
        [Property in keyof T]: StoreItem<T, T[Extract<keyof T, string>]['value']>
    }){

        this.state = new WeakMap();
        this.keys = Object.assign({});
        for (const key in state){

            const refKey = {
                key: key
            }

            this.state.set(
                refKey,
                state[key]
            );

            this.keys = Object.assign(
                this.keys,
                {
                    [key]: refKey
                }
            );
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
    
    get<
        K extends keyof T
    >(key: K){
        const cacheKey = this.keys[key];
        return cacheKey ? this.state.get(cacheKey)?.value as T[K]['value'] : undefined;
    }

    mutate(next: Partial<{
        [Property in keyof T]: T[Property]['value']
    }>){
        for (const key in next){
            const cacheKey = this.keys[key];
            const ref = this.state.get(cacheKey);

            ref && this.createMutation({
                key: cacheKey,
                item: ref,
                next: next[key]
            })
        }

        return this.getState()
    }

    async mutateAsync<
        K extends keyof T
    >(next: Partial<{
        [Property in keyof T]: T[Property]['value']
    }>){

        await Promise.all([
            ...Object.keys(next).map((key) => {
                const cacheKey = this.keys[key as K];
                const ref = this.state.get(cacheKey);

                return ref && this.createMutationAsync({
                    key: cacheKey,
                    item: ref,
                    next: next[key as K]
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
            const cacheKey = this.keys[key];
            const ref = this.state.get(cacheKey);

            ref && this.createTransform({
                key: cacheKey,
                item: ref,
                next: next[key] as (
                    prev: T[keyof T]['value']
                ) => T[keyof T]['value']
            })
        }

        return this.getState()
    }

    async transformAsync<
        K extends keyof T
    >(next: Partial<{
        [Property in keyof T]: (
            prev: T[Property]['value']
        ) => Promise<T[Property]['value']>
    }>){

        await Promise.all([
            ...Object.keys(next).map((key) => {
                const cacheKey = this.keys[key as K];
                const ref = this.state.get(cacheKey);

                return ref && this.createTransformAsync({
                    key: cacheKey,
                    item: ref,
                    next: next[key as K] as  (
                        prev: T[keyof T]['value']
                    ) => Promise<T[keyof T]['value']>
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
            const cacheKey = this.keys[key];
            const ref = this.state.get(cacheKey);
            const transforms = next[key] ?? []

            for (const transform of transforms){
                ref && this.createTransform({
                    key: cacheKey,
                    item: ref,
                    next: transform
                })

            }
        }

        return this.getState()
    }

    async seriesAsync<
        K extends keyof T
    >(next: Partial<{
        [Property in keyof T]: Array<
            (
                prev: T[Property]['value']
            ) => Promise<T[Property]['value']>
        >
    }>){

        await Promise.all([
            ...Object.keys(next).map((key) => {
                const cacheKey = this.keys[key as K];
                const ref = this.state.get(cacheKey);

                return ref && (
                    next[key as K] ?? []
                ).map(transform => 
                    this.createTransformAsync({
                        key: cacheKey,
                        item: ref,
                        next: transform
                    })    
                )
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
        for (const cacheKey in this.keys){
            const key = this.keys[cacheKey]
            const item = this.state.get(key)

            if (item){
                const next = transforms.reduce((prev, transform) => transform(prev), item.value);
                item.value = next
                this.state.set(
                    key,
                    item
                )

                this.emitChange()
                
            }

        }

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
        await Promise.all([
            ...Object.keys(this.keys).map((key) => {
                const cacheKey = this.keys[key as keyof T];
                const ref = this.state.get(cacheKey);

                return ref && transforms.map(transform => 
                    this.createTransformAsync({
                        key: cacheKey,
                        item: ref,
                        next: transform
                    })    
                )
            }).flat() as Array<Promise<void>>
        ])

        return this.getState()

    }

    private createTransform (
        {
            key,
            item,
            next
        }: {


            key: {
                key: Extract<keyof T, string>
            },
            item: StoreItem<T, T[Extract<keyof T, string>]['value']>,
            next: (
                prev: T[keyof T]['value']
            ) => T[keyof T]['value']
        }
    ) {

        item.value = next(item.value)
        this.state.set(
            key,
            item
        )

        this.emitChange()
    }

    private async createTransformAsync(
        {
            key,
            item,
            next
        }: {

            key: {
                key: Extract<keyof T, string>
            },
            item: StoreItem<T, T[Extract<keyof T, string>]['value']>,
            next: (
                prev: T[keyof T]['value']
            ) => Promise<T[keyof T]['value']>
        }
    ){

        item.value = await next(item.value)
        this.state.set(
            key,
            item
        )

        this.emitChange()
    }

    private createMutation(
        {
            key,
            item,
            next
        }: {

            key: {
                key: Extract<keyof T, string>
            },
            item: StoreItem<T, T[Extract<keyof T, string>]['value']>,
            next: T[Extract<keyof T, string>]['value']
        }
    ){

        item.value = item.update(item.value)(next)
        this.state.set(
            key,
            item
        )

        console.log(item.value)

        this.emitChange()
    }

    private async createMutationAsync(
        {
            key,
            item,
            next
        }: {

            key: {
                key: Extract<keyof T, string>
            },
            item: StoreItem<T, T[Extract<keyof T, string>]['value']>,
            next: T[Extract<keyof T, string>]['value']
        }
    ){

        item.value = await item.update(item.value)(next)
        this.state.set(
            key,
            item
        )

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
            [Property in keyof T]: T[Extract<keyof T, string>]['value']
        } = Object.assign({})

        for (const cacheKey in this.keys){
            const key = this.keys[cacheKey];
            const ref = this.state.get(key);

            state[cacheKey] = ref?.value
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