![build](https://github.com/adalundhe/delta-ts/actions/workflows/build_and_test.yml/badge.svg)
![npm version](https://img.shields.io/npm/v/delta-state?color=28920
)
![downloads](https://img.shields.io/npm/dt/delta-state?color=961866)
![bundle size](https://deno.bundlejs.com/badge?q=delta-state)
![unpacked size](https://img.shields.io/npm/unpacked-size/delta-state?label=unpacked%20size&color=843382)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](https://opensource.org/licenses/MIT)


# delta 🌌

Delta is a Typescript-first, minimal state manager for React that takes from the best features of 🐻 [Zustand](https://github.com/pmndrs/zustand/tree/main) and 👻 [Jotai](https://github.com/pmndrs/jotai). Delta combines a Zustand-like API with support for React Suspense, letting you manage your state the way you want.

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

----

### Derivations 🧬

One of the major challenges with centralized state stores is that they can quickly become unweildy. Let's examine the state store that manages the form component below:

```tsx
type ComplexUserForm = {
    firstName: string;
    lastName: string;
    setFirstName: (name: string) => void;
    setLastName: (name: string) => void
    setForm: (formData: Partial<ComplexUserForm>) => void
}

const useComplexform = create<ComplexUserForm>((set) => ({
    firstName: "",
    lastName: "",
    setFirstName(name){
        set({
            firstName: name
        })
    },
    setLastName(name){
        set({
            lastName: name
        })
    },
    setForm(formData){
        set(formData)
    }
}))

const UserForm = () => {

    const {
        firstName,
        lastName,
        setFirstName,
        setLastName,
        setForm
    } = useComplexForm((state) => state)

    return (
        <div className='flex flex-col items-center my-2'>
            <form onSubmit={(e) => {
                e.preventDefault();
                setForm({
                    firstName,
                    lastName
                });
            }}
            className='flex flex-col w-1/2 items-center'
            >
                <div className='flex flex-col items-center my-2'>
                    <label className='text-center'>First Name</label>
                    <input 
                        className='border my-2'
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className='flex flex-col items-center my-2'>
                    <label className='text-center'>Last Name</label>
                    <input 
                        className='border my-2'
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                <button type='submit'>
                    Submit
                </button>
            </form>
            <div className='flex flex-col w-1/2 items-center my-2'>
                <h1>My name is: {firstName} {lastName}</h1>

            </div>
        </div>
    )
}
```

We want to retain independent actions for updating our fields and submitting our form (since submitting said form might also entail HTTP requests, etc.), however as this form grows the number of state items and actions managed by the store will quickly grow. Likewise, we don't really even need to update our store state until we submit!

Delta allows you to accomplish this goal of deriving localized component state from store state via the `useDerived()` hook. Let's look at an example:

```tsx
// This is much easier to manage! Now we can add fields as 
// needed and delegate handling updates of those fields to
// their respective form component.
type ComplexUserForm = {
    firstName: string;
    lastName: string;
    setForm: (formData: Partial<ComplexUserForm>) => void
}

const useComplexForm = create<ComplexUserForm>((set) => ({
    firstName: "",
    lastName: "",
    setForm(formData){
        set(formData)
    }
}))

const UserForm = () => {

    const {
        firstName,
        lastName,
        setForm
    } = useComplexForm((state) => state)

    // useDerived() takes any valid "state slice" (any item(s) 
    // of a store's state) and returns the current value and a 
    // "setter" action like with React's useState() hook.
    const [userFirstName, setFirstName] = useDerived(firstName)
    const [userLastName, setLastName] = useDerived(lastName)

    return (
        <div className='flex flex-col items-center my-2'>
            <form onSubmit={(e) => {
                e.preventDefault();
                setForm({
                    firstName: userFirstName,
                    lastName: userLastName
                });
            }}
            className='flex flex-col w-1/2 items-center'
            >
                <div className='flex flex-col items-center my-2'>
                    <label className='text-center'>First Name</label>
                    <input 
                        className='border my-2'
                        value={userFirstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className='flex flex-col items-center my-2'>
                    <label className='text-center'>Last Name</label>
                    <input 
                        className='border my-2'
                        value={userLastName} 
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                <button type='submit'>
                    Submit
                </button>
            </form>
            <div className='flex flex-col w-1/2 items-center my-2'>
                <h1>My name is: {firstName} {lastName}</h1>

            </div>
        </div>
    )
}
```

We've refactored our store to only contain the form fields required
as well as the `setForm()` action we call we submitting our form. 
We then pass each of our `firstName` and `lastName` fields (which we refer to as "state slice(s)") to a `useDerived()` hook, returning the localized state and setter action.

This functions exactly as our previous example with a few key differences:

- Updates to the state store are not reflected in derivations unless those derivations are <b><i>linked</i></b> (we'll cover this down below in the <i>Recipes</i> section).

- Updates to derivations do not update store state. Per React Flow principles, state flow is unidirectional, meaning derivations can only derive from and/or respond to changes in upstream source.

Using derivations lets us keep store state concice focused, delegating the majority of component-specific state handling to that component. This makes it easy to use our form store to manage multiple different types of form components - ensuring they use the same basic set of fields and submit data the same way, but allowing each form to handle field input according to its own needs.

----

### Recipes 🍲

Let's cover some tricks and techniques for Delta!
<br/>

#### Linking 🔗

One of the important features of Delta's derivations is that like Jotai's atoms, they can be derived from any piece of state - including stores, React state, or even other derivations. Let's look at the counter app below:

```tsx

type Counter = {
    count: number,
    increment: () => void
};

const useCounter = create<Counter>((set, get) => ({
    count: 0,
    increment: () => {
        set({count: get().count + 1})
    }
}));

const Counter = () => {
  
  const {
    count,
    add
  } = useCounter((state) => ({
    count: state.count,
    add: state.increment
  }));

  const [counter, setCounter] = useDerived(count);


  return (
    <div className="container flex flex-col justify-center items-center">
        <button 
          className="my-4 border w-fit p-4" 
          onClick={() => add()}
        >
          Increment Local Counter
        </button>
        <h1 className="text-center">
          This number is: {count}
        </h1>
        <button 
          className="my-4 border w-fit p-4" 
          onClick={() => setCounter(counter + 1)}
        >
          Increment Derived Counter
        </button>
        <h1 className="text-center">
          This number is: {counter}
        </h1>
    </div>
  );
}
```

Our app above uses a store and a derivation to manage a pair of counters. We want both the "Increment Local" and "Increment Global" buttons to increase our counter. However when we press "Increase Global" nothing happens! What's the deal?! 

As mentioned before, by default derivations <i>do not</i> reflect updates to any external state (Delta store, React state, etc.). For this reason, we refer to derivations as <i>unlinked</i>. However, we can tell our derivation we want it to listen for and update based on changes to source state by providing a `link()` function as the second argument to the `useDerived()` hook:

```tsx

type Counter = {
    count: number,
    increment: () => void
};

const useCounter = create<Counter>((set, get) => ({
    count: 0,
    increment: () => {
        set({count: get().count + 1})
    }
}));

const Counter = () => {
  
  const {
    count,
    add
  } = useCounter((state) => ({
    count: state.count,
    add: state.increment
  }));

  const [counter, setCounter] = useDerived(
    count,

    // Here's our link function, telling our derived counter that any time 
    // the `count` state upon which it's based receives an update it should
    // increment it's local count by one.

    (_, next) => next + 1
  );


  return (
    <div className="container flex flex-col justify-center items-center">
        <button 
          className="my-4 border w-fit p-4" 
          onClick={() => add()}
        >
          Increment Local Counter
        </button>
        <h1 className="text-center">
          This number is: {count}
        </h1>
        <button 
          className="my-4 border w-fit p-4" 
          onClick={() => setCounter(counter + 1)}
        >
          Increment Derived Counter
        </button>
        <h1 className="text-center">
          This number is: {counter}
        </h1>
    </div>
  )
}
```

A `link()` is a function accepting two arguments - the <i>source state</i> (the external state upon which the derivation is based), and the second the <i>local state</i> the state internal to the derivation itself. Link functions allow you to reconcile the difference between the source and local state of a derivation so that the behavior of your application remains consistent.

#### Stores as Atom Generators 🧪

Stores aren't solely for holding application state - they can also be used to generate derivations on-the-fly!

```tsx
import { create, useDerived, Derived } from 'delta-state'

interface CounterStore {
  counterAtom: Derived<number>
};

const useCounterStore = create<CounterStore>((set) => ({
  useCounter: useDerived
}));

export default function CounterApp() {

  const {
    useCounter
  } = useCounterStore((state) => ({
    useCounter: state.useCounter
  }));

  const [
    counter,
    setCounter
  ] = useCounter(0);

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

Delta includes the `Derived<T>` type, which allows you to pass the useDerived hook as a store item. You can then create an instance of that derivation wherever needed!

#### Comparators and Controlling State Updates 📡

A store's `subscribe()` method can take an optional `comparator()` function as an argument, which allows you to filter state updates or subscription events:

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

Comparator functions accept a single object argument containing `next` and `prev` - with `next` being the requested state update and `prev` being the current store state - and return a `boolean` (the value of the comparison performed in the function). We recommend using comparators to optimize your application's performance by controlling when state updates and React re-renders occur.
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

### Use with Async and Suspense 🤖

Borrowing from Jotai, Delta stores support Suspense and async usage. To enable async usage, you need to pass an async function to the call to `create()` and wrap the store type with a `Promise<T>` generic:

```tsx
// app.tsx

import { create } from 'delta-state'

type PokemonTrainer = {
    trainerName: string;
    updateTrainerName: (updatedName: string) => void;
};

// Here we pass an async function and wrap our `PokemonTrainer` type
// with a Promise<T> generic.
const useTrainerStore = create<Promise<PokemonTrainer>>(async (set) => ({
    trainerName: "Ash",
    updateTrainerName: (updatedName: string) => set({
        trainerName: updatedName
    })
}));

const TrainerAboutPage = () => {
    ...
}
```

The call your hook and use your store as you normally would!

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

----
### Credits and Thanks 🙏

A massive thank you to Poimandres, the Zustand and Jotai maintainers, and Daishi Kato for creating two wonderful state management libraries that inspired this project. You make writing software fun and worthwhile.

-AL
