import { create, useAtom } from "../src/react"


const useMyCustomStore = create({
    boop: {
        value: [] as number[],
        concat: (next: number[]) => async (prev: number[]) => prev.concat(next)
    },
    beep: {
        value: "",
        concat: (next: string) => (prev: string) => prev + next,

    }
})



const {
    beep,
    boop
} = useMyCustomStore(
    (store) => ({
        boop: store.boop,
        beep: store.beep
    })
)

const {
    value
} = useAtom({...boop}, ({
    value
}) => ({
    value: value.length > 0 ? value : value
}))

console.log(beep.concat('test'))