import { Store } from '../src/store'

const store = Store.init({
    boop: {
        value: [] as number[],
        update: (
            prev: number[]
        ) => (
            next: number[]
        ) => prev.concat(next)
    }
})


// const {
//     boop
// } = useStore(store)

store.mutate({
    boop: [0]
})

store.transform({
    boop: (prev: number[]) => [
        1,
        ...prev
    ]
})

store.norm({
    transforms: [
        (prev: number[]) => [
            2,
            ...prev
        ],
        (prev: number[]) => [
            3,
            ...prev
        ]
    ]
})

const {
    boop
} = store.series({
    boop: [
        (prev: number[]) => [
            4,
            ...prev
        ],
        (prev: number[]) => [
            5,
            ...prev
        ]
    ]
})

console.log(boop)