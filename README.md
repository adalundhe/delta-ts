![build](https://github.com/adalundhe/delta-ts/actions/workflows/build_and_test.yml/badge.svg)
![npm version](https://img.shields.io/npm/v/delta-state?color=28920
)
![downloads](https://img.shields.io/npm/dt/delta-state?color=961866)
![bundle size](https://img.shields.io/bundlephobia/minzip/delta-state)
![unpacked size](https://img.shields.io/npm/unpacked-size/delta-state?label=unpacked%20size&color=843382)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](https://opensource.org/licenses/MIT)


# delta 🌌

Delta is a Typescript-first, minimal, and composable state manager for React that takes from the best features of 🐻 [Zustand](https://github.com/pmndrs/zustand/tree/main) and 👻 [Jotai](https://github.com/pmndrs/jotai). Combining the concepts of state stores and atoms with a Zustand-like API, Delta lets your state flow the way you want.

----
### Wait another state manager? 😵‍💫

Modern React has no shortage of ways to get your application's state where it's needed - whether `Immer`, `Zustand`, `Jotai`, `Recoil`, `MobX`, or (<i>gasp</i>) `Redux` . Of these, we've found Pmndr's `Zustand` and `Jotai` to be the most flexible, and particularly effective when combined.

Delta formalizes this combination as a singular library while presenting a uniform, consistent API for working with either-and-or-both. We really think you'll like it!

----
### Let's store some state! 🍱

Coming from React, you're likely be familiar with the `useState` react hook. 

```tsx
// app.tsx

const TrainerAboutPage = () => {

  const [trainerName, updateTrainerName] = useState<string>("");

  return  (
    <div className="flex flex-col items-center">
      <div className="flex flex-col mt-2 mb-12 text-center">
        <h1>Hello, my name is {trainerName}</h1>
      </div>
      <form className="flex flex-col">
          <div className="mt-2 mb-4 flex flex-col">
            <label className="text-lg">Trainer Name</label>
            <input 
                className="border w-fit"
                value={trainerName} 
                onChange={(e) => updateTrainerName(e.target.value)}
            />
          </div>
        </form>  
    </div>
  );
}
```


While this is great for storing and updating things local to a given component, managing more than a few pieces of or sharing that state between components via props can quickly become arduous and hazardous. 

This is where state management libraries Delta come in! You'll want to start by creating both the type definition for your state and a Delta store via `create()` <i>outside</i> of your client-side React component:

```tsx
// app.tsx

import { create } from 'delta-state'

// We need this so Delta knows what our state looks like
// and we can infer types correctly in the component.
type PokemonTrainer = {
    trainerName: string;
    updateTrainerName: (updatedName: string) => void;
};

// We call "create()", pass the function that sets our
// default state, and return a custom React hook to 
// use in our component.
const useTrainerStore = create<PokemonTrainer>((set) => ({
    trainerName: "Ash",
    updateTrainerName: (updatedName: string) => set({
        trainerName: updatedName
    })
}));

const TrainerAboutPage = () => {
    ...
}
```

There's quite a bit above so let's break it down:

- 1️⃣ We specify a `type` or `interface` so our store knows what types it needs when used in a component. 
<br/>

- 2️⃣ We call `create()` <b><u>outside</u></b> our component, passing our type as an argument to the generic (i.e. to the `T` of `create<T>())` which ensures our store knows what types it needs when used in our components.
<br/>

- 3️⃣ Then we pass a function like `(set) => ({ ...initial state here })`, specifying our initial state (including functions to mutate state).
<br/>

- 4️⃣ We call `set()` inside of the `updateTrainerName()` action. You call `set()` at any point inside an action you want to mutate store state, passing the updated values (usually a partial object of the original state).
<br/>

- 5️⃣ Our call to `create()` returns a function, which we then store in a variable that <b>must</b> named as a custom hook. Recall that for React a hook is any function prefixed with `use` following by a capital letter (i.e. `useMyHook`).
<br/>
<br/>

We aren't done yet, we still need to use our store inside the component! We can do this by calling our custom hook and passing a `selector` function as below;

```tsx
// app.tsx
...

const TrainerAboutPage = () => {

  const {
      name,
      updateName
  } = useTrainerStore((state) => ({
      name: state.trainerName,
      updateName: state.updateTrainerName
  }));

  return  (
    <div className="flex flex-col items-center">
      <div className="flex flex-col mt-2 mb-12 text-center">
        <h1>Hello, my name is {name}</h1>
      </div>
      <form className="flex flex-col">
          <div className="mt-2 mb-4 flex flex-col">
            <label className="text-lg">Trainer Name</label>
            <input 
                className="border w-fit"
                value={name} 
                onChange={(e) => updateName(e.target.value)}
            />
          </div>
        </form>  
    </div>
  );
}
```
<br/>

Let's again break down what we've done:

- 1️⃣ We called our custom `useTrainerStore()` hook.
<br/>

- 2️⃣ We passed a <b>selector</b> function like `(state) => ({ ...selected state })`, telling our hook which parts of our store's state we want to consume in this component (also known as a <i>state slice</i>).
<br/>

- 3️⃣ We specified <i>aliases</i> for the items returned by our state slice. This is a handy way to make sure names remain relevant to the given component or to shorten keys for a given state slice.
<br/>

- 4️⃣ Our hook returned an object representing the state slice we specified, which we then deconstructed to directly access returned items via the aliases we specified.

<br/>

> <b>Why Require Selectors?</b> 💡 
> 
> If you're coming from Zustand, you'll remember that selectors are optional when calling store hooks. Zustand maintainers themselves discourage this as it returns all state in a given store, so Delta opts to make passing selectors to store hooks required.
<br/>

Putting it all together, our solutions looks like:

```tsx
// app.tsx

import { create } from 'delta-state'

type PokemonTrainer = {
    trainerName: string;
    updateTrainerName: (updatedName: string) => void;
};

const useTrainerStore = create<PokemonTrainer>((set) => ({
    trainerName: "Ash",
    updateTrainerName: (updatedName: string) => set({
        trainerName: updatedName
    })
}));

const TrainerAboutPage = () => {

  const {
      name,
      updateName
  } = useTrainerStore((state) => ({
      name: state.trainerName,
      updateName: state.updateTrainerName
  }));

  return  (
    <div className="flex flex-col items-center">
      <div className="flex flex-col mt-2 mb-12 text-center">
        <h1>Hello, my name is {name}</h1>
      </div>
      <form className="flex flex-col">
          <div className="mt-2 mb-4 flex flex-col">
            <label className="text-lg">Trainer Name</label>
            <input 
                className="border w-fit"
                value={name} 
                onChange={(e) => updateName(e.target.value)}
            />
          </div>
        </form>  
    </div>
  );
}
```
<br/>

And like that we've create and consumed our first Delta store!
<br/>
<br/>

---
### Going Atomic 🔬

Using a store to manage a single bit of state naturally seems a bit clunky and cumbersome. This is where Delta's other state management mechanism - atoms - comes in handy.

Unlike full-blown stores, atoms are designed specifically to handle smaller, focused bits of state. Let's create an atom via the `useAtom()` hook:

```tsx
// app.tsx
import { useAtom } from 'delta-state'

const TrainerAboutPage = () => {

  const trainerName = useAtom('Ash');

  return  (
    <div className="flex flex-col items-center">
      <div className="flex flex-col mt-2 mb-12 text-center">
        <h1>Hello, my name is {trainerName.get()}</h1>
      </div>
      <form className="flex flex-col">
          <div className="mt-2 mb-4 flex flex-col">
            <label className="text-lg">Trainer Name</label>
            <input 
                className="border w-fit"
                value={name} 
                onChange={(e) => trainerName.set(e.target.value)}
            />
          </div>
        </form>  
    </div>
  );
}
```

We can then call `get()` and `set()` on our atom to access and update state.

This condensed API is what makes atoms unique - like React's `useState()` all information relevant to the given piece of state are effectively specified inline. Unlike `useState()`, the methods to manipulate and retrieve state are owned by the atom, so keeping track of where changes occur and state is being consumed is easier.

We can do a lot more than just passing values to atoms - `get()`, `set()` and calls to `useAtom()` also accept functions with a helpful (optional) `get()` arg to extract values from other atoms:

```tsx
// app.tsx
import { useAtom } from 'delta-state'

const TrainerAboutPage = () => {

  const lastName = useAtom('Pikachu');
  const trainerName = useAtom((get) => `Ash ${get(lastName)}`);

  return  (
    <div className="flex flex-col items-center">
      <div className="flex flex-col mt-2 mb-12 text-center">
        <h1>Hello, my name is {trainerName.get((get) => `${get(trainerName)}!`)}</h1>
      </div>
      <form className="flex flex-col">
          <div className="mt-2 mb-4 flex flex-col">
            <label className="text-lg">Trainer Name</label>
            <input 
                className="border w-fit"
                value={name} 
                onChange={(e) => trainerName.set(() => e.target.value)}
            />
          </div>
        </form>  
    </div>
  );
}
```

This allows you to compose atoms while keeping individual atom state pure.

Atoms also allow you to subscribe to state updates, via `subscribe()`:

```tsx
import { useAtom } from 'delta-state'

export default function CounterApp() {

  const atom = useAtom(0);
  const atomTwo = useAtom('even');

  // Our subscription will trigger every time a state update
  // for our first atom occurs, which we can then use to set
  // the state of our second atom.
  atom.subscribe((count) => {
    atomTwo.set((get) => count%2 ? 'odd' : 'even')
  });

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button className="my-4 border w-fit p-4" onClick={() => atom.set((get) => get(atom) + 1)}>
            Increment Local Counter
          </button>
          <h1 className="text-center">
            {atom.get()}
          </h1>
        </div>
      </main>
    </>
  );
}
```

By default, subscriptions will trigger any time a given atom's state is updated.

----
### Recipes 🍲

Let's cover some tricks and techniques for Delta!
<br/>

#### Linking 🔗

One of the primary advantages of Delta we first mentioned was <i>composable state</i> by combining stores and atoms. One of the important features of Delta's atoms is that, like Jotai, atoms can be derived from any piece of state - including other atoms. Let's look at the counter app below:

```tsx
import { create, useAtom } from 'delta-state'

interface CounterStore {
  counter: number
  add: (next: number) => void
};

const useCounterStore = create<CounterStore>((set) => ({
  counter: 0,
  add: (next: number) =>  set({
    counter: next + 1
  })
}));

const CounterApp = () => {

  const {
    count,
    add
  } = useCounterStore((state) => ({
    count: state.counter,
    add: state.add
  }));

  const atom = useAtom(count);

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button 
            className="my-4 border w-fit p-4" 
            onClick={() => atom.set((get) => get(atom) + 1)}
          >
            Increment Local Counter
          </button>
          <button className="my-4 border w-fit p-4" onClick={() => add(count)}>
            Increment Global Counter
          </button>
          <h1 className="text-center">
            {atom.get()}
          </h1>
        </div>
      </main>
    </>
  );
}

```

Our app above uses a store and an atom created using the `useAtom()` hook to manage the same counter. Since our atom's state is created using the `useAtom()` hook from the state of the store's count value, we refer to the atom as a <i><b>derived atom</i></b>. We want both the "Increment Local" and "Increment Global" buttons to increase our counter. However when we press "Increase Global" nothing happens! What's the deal?!

By default, atom state is <i>isolated</i>. Only that atom's `set()` can update it's state. However, we can tell our atom we want it to listen for and update based on changes to source state by providing a `link()`:

```tsx
import { create, useAtom } from 'delta-state'

interface CounterStore {
  counter: number
  add: (next: number) => void
};

const useCounterStore = create<CounterStore>((set) => ({
  counter: 0,
  add: (next: number) =>  set({
    counter: next + 1
  })
}));

const CounterApp = () => {

  const {
    count,
    add
  } = useCounterStore((state) => ({
    count: state.counter,
    add: state.add
  }));

  const atom = useAtom(count, (source, local) => local + 1);

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button 
            className="my-4 border w-fit p-4" 
            onClick={() => atom.set((get) => get(atom) + 1)}
          >
            Increment Local Counter
          </button>
          <button className="my-4 border w-fit p-4" onClick={() => add(count)}>
            Increment Global Counter
          </button>
          <h1 className="text-center">
            {atom.get()}
          </h1>
        </div>
      </main>
    </>
  );
}
```

A `link()` is a function accepting two arguments - the first the source state and the second the atom's "local" state - and returns a value matching the type specified to the atom that the atom will use for its next state. Link functions allow you to reconcile the difference between the source and local state of a derived atom so that the behavior of your application remains consistent.
<br/>

#### Stores as Atom Generators 🧪

Stores aren't solely for holding application state - they can also be used to generate atoms on-the-fly!

```tsx
import { create, useAtom, Atomic } from 'delta-state'

interface CounterStore {
  counterAtom: Atomic<number>
};

const useCounterStore = create<CounterStore>((set) => ({
  counterAtom: useAtom
}));

export default function CounterApp() {

  const {
    useCounterAtom
  } = useCounterStore((state) => ({
    useCounterAtom: state.counterAtom
  }));

  const atom = useCounterAtom(0);

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button className="my-4 border w-fit p-4" onClick={() => atom.set((get) => get(atom) + 1)}>
            Increment Local Counter
          </button>
          <h1 className="text-center">
            {atom.get()}
          </h1>
        </div>
      </main>
    </>
  );
}
```

Delta includes the `Atomic<T>` type, which allows you to pass the useAtom hook as a store item. You can then create an instance of that atom wherever needed!
<br/>

#### Comparators and Controlling State Updates

Stores and the atom's `subscribe()` method take an optional `comparator()` function that allows you to filter state updates or subscription events:

```tsx
import { create } from 'delta-state'

interface Store {
  counter: number;
  add: (amount: number) => void
}

const useMyCustomStore = create<Store>((set) => ({
  counter: 0,
  add: (amount) => set({
    counter: amount + 1
  })
}));


const CounterApp = () => {

  const { 
    counter,
    add
   } = useMyCustomStore(
    ({ counter, add }) => ({
      counter,
      add
    }),

    // The counter will only update if the next value
    // of the counter is greater than zero and greater
    // than its last value.
    ({ next, prev }) => next.counter > 0 && next > prev
  );
  

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">   
          <button className="my-4 border w-fit p-4" onClick={() => {
            
            // Our add() won't trigger state updates or re-renders
            // because the comparator() will filter them out.
            add(0)
          }}>
            Increment Local Counter
          </button>
          <h1 className="text-center">
            {counter}
          </h1>
        </div>
      </main>
    </>
  );
}

```

For atoms, comparators can be used to filter subscription events:

```tsx
import { useAtom } from 'delta-state'

export default function CounterApp() {

  const atom = useAtom(0);

  atom.subscribe(
    (count) => {
      console.log('Next odd number is: ', count);
    }, 

    // Our subscription will only trigger
    // on odd numbers. We can also omit `prev`
    // since we aren't using it.
    ({ next }) => next%2 === 1
  );

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button className="my-4 border w-fit p-4" onClick={() => atom.set((get) => get(atom) + 1)}>
            Increment Local Counter
          </button>
          <h1 className="text-center">
            {atom.get()}
          </h1>
        </div>
      </main>
    </>
  );
}
```

Comparator functions accept a single object argument containing `next` and `prev` - with `next` being the requested state update and `prev` being the currnet store or atom state - and return a `boolean` (the value of the comparison performed in the function). We recommend using comparators to optimize your application's performance by controlling when state updates and React re-renders occur.
<br/>

#### Getting State in an Action

Until now, we've been passing the value of `counter` to our `add()` action to update the count. However (like Zustand), we can also access the state of the store within an action via `get()`.

```tsx
const useCounterStore = create<Store>((set, get) => ({
  counter: 0,
  add: () => set({
    counter: get().counter + 1
  })
}));
```

To access `get()`, just specify it as an argument in addition to `set()`!

<br/>

----
### Async and Usage Without React 🤖

Delta supports both sync and async use without react. Import from either `delta-state/async` or `delta-state/base` to access the async and base versions of atoms.

Rather than calling `useAtom()`, you'll instead call `atom()` to create an `async` or `base` atom:


```ts
// async.ts

import { atom } from "delta-state/base";

const runCounter = () => {
  const counterAtom = atom(0)
  counterAtom.set((get) => get(counterAtom) + 1)
}


runCounter()
```

Async atoms require async functions for `atom()` and `set()`, which must be awaited:

```ts
// async.ts

import { atom } from "delta-state/async";

const runCounter = async () => {
  const counterAtom = await atom(async (get) =>  0)
  await counterAtom.set(async (get) => get(counterAtom) + 1)
}


runCounter()
```

Creating async and base stores follows much the same pattern as their react counterpart, with the exception that you must pass an async function and await the Promise returned by `create()` for async stores:

```ts
import { create } from "delta-state/async";

interface Store {
  counter: number;
  add: (amount: number) => void
}

// This isn't just a function but a Promise! We'll need to
// await it.
const createCounterStore = create<Store>(async (set) => ({
  counter: 0,
  add: (amount) => set({
    counter: amount + 1
  })
}));


...

const runAsyncCounter = async () => {
  
  // The call to create() returns a Promise so
  // we'll need to await it if we want to get the
  // function to use our store.
  const asyncStore = await createCounterStore<CounterStore>(
    (set, get) => ({
      count: 0,
      updateCount: (next: number) =>
        set({
          count: next + get().count,
        })
    })
  );
}

runAsyncCounter()
```

For base stores:

```ts
import { create } from "delta-state/base";

interface Store {
  counter: number;
  add: (amount: number) => void
}
const createCounterStore = create<Store>((set) => ({
  counter: 0,
  add: (amount) => set({
    counter: amount + 1
  })
}));


...

const runCounter = () => {
  const customStore = createCounterStore<CounterStore>(
    (set, get) => ({
      count: 0,
      updateCount: (next: number) =>
        set({
          count: next + get().count,
        })
    })
  );
}

runCounter()
```

As with React stores, we return both our value and action. However,
unlike React stores, state for base and async store <b><i>does not automatically update when an action or</i></b> `set()` <b><i>is called</i></b>. In order
to access the updated store value after calling an action you must call the `get()` method, which (like when calling `get()` inside an action) returns the entire store:

```ts
// async.ts

...

const runAsyncCounter = async () => {

  const asyncStore = await createAsync<CounterStore>(
    (set, get) => ({
      count: 0,
      updateCount: (next: number) =>
        set({
          count: next + get().count,
        })
    })
  );

  const {
    // Let's skip our count here since it
    // won't be updated
    updateCount, 
    get
  } = asyncStore((state) => state);

  updateCount(1)

  // This is how we get our updated count.
  const {
    count
  } = get()

}

runAsyncCounter()
```

We can also update the store by calling `set()`, which works exactly as it does when you call it inside an action:

```ts
// async.ts

...

const runAsyncCounter = async () => {

  const asyncStore = await createAsync<CounterStore>(
    (set, get) => ({
      count: 0,
      updateCount: (next: number) =>
        set({
          count: next + get().count,
        })
    })
  );

  const {
    set
  } = asyncStore((state) => state);

  // Our count will now be 10.
  set({
    count: 10
  })

}

runAsyncCounter()
```
If you need to access store state changes reactively (i.e. whenever an action or `set()` mutates store state), you can call `subscribe()` on both async and base stores. Like `subscribe()` for atoms, the function takes a callback and optional comparator function:

```ts
// async.ts

...

const runAsyncCounter = async () => {

  const asyncStore = await createAsync<CounterStore>(
    (set, get) => ({
      count: 0,
      updateCount: (next: number) =>
        set({
          count: next + get().count,
        })
    })
  );

  const {
    updateCount,
    set,
    subscribe
  } = asyncStore((state) => state);

  // This will trigger on every update.
  subscribe(({ count }) => {
    console.log(count);
  });

  // This will only trigger if we update the count
  // to 100 more than its previous value.
  subscribe(({ count }) => {
    console.log(count);
  }, ({ next, prev }) => next > prev + 100);

  // Our count will now be 1, triggering the
  // first subscription but not the second.
  set({
    count: 1
  })

  // This will trigger both our subscriptions.
  updateCount(100)

}

runAsyncCounter()

```

----
### Credits and Thanks 🙏

A massive thank you to Pmndrs, the Zustand and Jotai maintainers, and Daishi Kato for creating two wonderful state management libraries that inspired this project. You make writing software fun and worthwhile.

-AL
