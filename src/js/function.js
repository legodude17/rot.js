/**
 * Sets prototype of this function to an instance of parent function
 * @param {function} parent
 */
export default function extend(parent, child) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
  return this;
}
