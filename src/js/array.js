import { getUniform } from '../rng';
/**
 * @returns {any} Randomly picked item, null when length=0
 */
export function pickRandom(arr) {
  if (!arr.length) { return null; }
  return arr[Math.floor(getUniform() * arr.length)];
}

/**
 * @returns {array} New array with randomized items
 */
export function randomizeArray(arr) {
  const result = [];
  const clone = arr.slice();
  while (clone.length) {
    const index = clone.indexOf(pickRandom(clone));
    result.push(clone.splice(index, 1)[0]);
  }
  return result;
}
