import { useStore, useSelector } from "../src/react"


const store = useStore({
    boop: {
        value: [] as number[],
        update: (prev: number[]) => async (next: number[]) => prev.concat(next)
    },
    beep: {
        value: "Hello",
        test: (prev: string) => (next: string) => prev + next
    }
})



const {
    beep,
    boop
} = useSelector(
    store,
    (store) => ({
        boop: store.boop,
        beep: store.beep
    })
)

beep.test('Test')
console.log(beep.value)