/**
 * Always positive modulus
 * @param {int} n Modulus
 * @returns {int} this modulo n
 */
export default function mod(n1, n2) {
  return ((n1 % n2) + n2) % n2;
}
