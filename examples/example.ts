import { link } from "fs";
import { 
  create, 
  atom, 
  AtomHook, 
  createAsync, 
  asyncAtom,
  useAtom,
  DerivedAtom
} from "../src";

interface Store {
  useMyNums: AtomHook<number[]>
}

interface AsyncStore {
  useMyAsyncNums: AtomHook<number[]>
  useMyDerivedNums: DerivedAtom<number[]>
}

const useMyCustomStore = create<Store>(() => ({
  useMyNums: atom<number[]>((set) => [
    [],
    (next: number[]) => set(next)
  ])
}));

const { useMyNums } = useMyCustomStore(
  ({ useMyNums }) => ({
    useMyNums
  })
);

const [myNums, setMyNums] = useMyNums((state) => state)

const customAsyncStore = createAsync<AsyncStore>(async () => ({
  useMyAsyncNums: await asyncAtom<number[]>(async (set) => [
    [],
    (next: number[]) => set(next)
  ]),
  useMyDerivedNums: useAtom
}))

const example = async () => {

  const useMyCustomAsyncStore = await customAsyncStore

  const {
    useMyAsyncNums,
    useMyDerivedNums
  } = await useMyCustomAsyncStore(({
    useMyAsyncNums,
    useMyDerivedNums
  }) => ({
    useMyAsyncNums,
    useMyDerivedNums
  }))

  const [nums, setMyNums] = useMyAsyncNums((nums) => nums)

  const [derived, setDerived] = useMyDerivedNums(
    nums, 
    (set) => (next: number[]) => set(next.concat(nums)),
    (source, next) => source.concat(next)
  )

}