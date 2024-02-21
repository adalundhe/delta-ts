import { Store } from '../src/store'
import { useStore } from '../src/react_store'

const store = Store.init({
    boop: {
        value: [] as number[],
        update: (prev: number[]) => (next: number[]) => prev.concat(next)
    }
})


const {
    boop
} = useStore(store)

store.mutate({
    boop: [0]
})

store.transform({
    boop: (prev) => [...prev, 1]
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

store.series({
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