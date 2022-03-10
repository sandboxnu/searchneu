import { act } from 'react-dom/test-utils';

/* 
A function to suppress a warning with state changes on
enzyme mounted components. Enzyme said they fixed this but it
doesn't seem to have changed (and we're on latest version 3.11)
See issue: https://github.com/enzymejs/enzyme/issues/2073
*/
export async function waitForComponentToPaint(wrapper) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
