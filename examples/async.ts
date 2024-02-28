import { atom } from "../src/async";

const test = async () => {
  const atomTwo = await atom(0);
  const atomThree = await atom(0);

  atomThree.subscribe((count) => {
    atomTwo.set(count + atomTwo.get());
    console.log(count);
  });

  atomThree.set(1);
  atomThree.set(1);
  atomThree.set(1);

  console.log(atomThree.get());

  console.log(atomTwo.get());
};

test();
