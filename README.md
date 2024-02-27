[![npm version](https://badge.fury.io/js/delta-state.svg)](https://badge.fury.io/js/delta-state)
![bundle_size](https://deno.bundlejs.com/badge?q=delta-state&treeshake=[*])

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

Unlike full-blown stores, atoms are designed specifically to handle smaller, focused bits of state. Delta offers two ways to instantiate them - via `atom()` and via the `useAtom()` hook. Let's start with the former:

```tsx
// app.tsx

import { atom } from 'delta-state'

const useTrainerAtom = atom<string>((set) => [
  'Ash',
  (updatedName: string) => set(updatedName)
]);

const TrainerAboutPage = () => {
    ...
}
```
<br/>

Like a store, we call the atom method, pass a type or interface specifying what the type of state we're providing is, pass a function specifying the initial state, and return a custom React hook to consume in a component. Unlike a store, we only need to pass the type of data specific to the atom then specify an initial value and an action to update the atom's state. 

This condensed API is what makes atoms unique - like React's `useState()` all information relevant to the given piece of state are effectively specified inline. Unlike `useState()`, <i>we get to define how that state is updated right in the declaration</i>. This means no matter where an atom is consumed, the mechanism for manipulating its state remains as consistent as possible.

Continuing below, we call our custom `useTrainerAtom()` hook inside our component, passing a selector like we did when we called our custom store hook:


```tsx
// app.tsx
...

const TrainerAboutPage = () => {

  const [name, updatedName] = useTrainerAtom((state) => state);

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

> <b>Why Selectors with Atoms?</b> 💡 
> 
> While atoms are designed to handle discrete pieces of state, sometimes these discrete pieces may take the form of arrays, objects, or other more complex data. By requiring use of selectors with atoms like we do with stores, we make dealing with complex data easier and achieve a more consistent API.

<br/>

Like `useState()`, our call to our atom hook returns a two-element array, with the first item being the state value and the second being the action to update that state.

Finally let's examine the `useAtom()` hook:


```tsx
// app.tsx
import { useAtom } from 'delta-state'

const TrainerAboutPage = () => {

  const [name, updatedName] = useAtom(
    'Ash',
    (set) => (updatedName: string) => set(updatedName)
  );

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

This achieves exactly what the above example does, but localizes the state to the given component.

> <b>Atom vs useAtom?</b> 💡 
> 
> In general, we recommend using `atom()` when you need to share a discrete piece of state between multiple components and `useAtom()` when that state needs to be local to the component.

<br/>

----
### Recipes 🍲

Let's cover some tricks and techniques for Delta!
<br/>

#### Linking 🔗

One of the primary advantages of Delta we first mentioned was <i>composable state</i> by combining stores and atoms. One of the important features of Delta's atoms is that, like Jotai, atoms can be derived from any piece of state - including other atoms. Unlike Jotai, atoms in Delta allow you to control how they respond to changes in derived state.

Let's look at the counter app below:

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

  const [
    counter,
    setCounter
  ] = useAtom(
    count,
    (set) => (next: number) => set(next + 1)
  );

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button 
            className="my-4 border w-fit p-4" 
            onClick={() => setCounter(counter)}
          >
            Increment Local Counter
          </button>
          <button className="my-4 border w-fit p-4" onClick={() => add(counter)}>
            Increment Global Counter
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
<br/>

Our app above uses a store and an atom created using the `useAtom()` hook to manage the same counter. Since our atom's state is created using the `useAtom()` hook from the state of the store's count value, we refer to the atom as a <i><b>derived atom</i></b>. We want both the "Increment Local" and "Increment Global" buttons to increase our counter. However when we press "Increase Global" nothing happens! What's the deal?!

By default, state of atoms created using `useAtom()` is <i>isolated</i>. This means state managed via an atom created by `useAtom()` can <i>only</i> be updated by calling the update function we provided to that atom. However, we can tell our atom we want it to listen for and update based on changes to source state by providing a `link()`:

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

  const [
    counter,
    setCounter
  ] = useAtom(
    count,
    (set) => (next: number) => set(next + 1),
    (source, next) => next + 1
  );

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button 
            className="my-4 border w-fit p-4" 
            onClick={() => setCounter(counter)}
          >
            Increment Local Counter
          </button>
          <button className="my-4 border w-fit p-4" onClick={() => add(counter)}>
            Increment Global Counter
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
<br/>

A `link()` is a function accepting two arguments - the first the source state and the second the atom's "local" state - and returns a value matching the type specified to the atom that the atom will use for its next state. Link functions allow you to reconcile the difference between the source and local state of a derived atom so that the behavior of your application remains consistent.
<br/>

#### Stores as Atom Generators 🧪

Stores aren't solely for holding application state - they can also be used to generate atoms on-the-fly!

```tsx
import { create, useAtom, DerivedAtom } from 'delta-state'

interface CounterStore {
  counterAtom: DerivedAtom<number>
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

  const [
    counter,
    setCounter
  ] = useCounterAtom(
    0,
    (set) => (next: number) => set(next + 1)
  );

  return (
    <>
      <main>
        <div className="container flex flex-col justify-center items-center">
          <button className="my-4 border w-fit p-4" onClick={() => setCounter(counter)}>
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

Delta includes the `DerivedAtom<T>` type, which allows you to pass the useAtom hook as a store item. You can then alias and instantiate an instance of that atom wherever needed!
<br/>

#### Comparators and Controlling State Updates

In addition to selectors store and atom hooks you create via `atom()` can take an optional <i><b>comparator</b></i> function that will only allow for store or atom state to be updated if the comparator function returns `true`:

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
          <button className="my-4 border w-fit p-4" onClick={() => add(0)}>
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
### Credits and Thanks 🙏

A massive thank you to Pmndrs, the Zustand and Jotai maintainers, and Daishi Kato for creating two wonderful state management libraries that inspired this project. You make writing software fun and worthwhile.

-AL
