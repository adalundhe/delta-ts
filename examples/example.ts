import { useStore, useSelector } from "../src/react"



const store = useStore({
    boop: {
        value: [] as number[],
        update: (prev: number[]) => (next: number[]) => prev.concat(next)
    },
    beep: {
        value: 1,
        update: (prev: number) => (next: number) => prev + next
    }
})


const {
    beep
} = useSelector(
    store,
    (state, mutations) => ({
        beep: {
            value: state.beep,
            update: mutations.beep
        }
    })
)


beep.update({beep: 1})