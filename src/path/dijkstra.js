import Path from './path';
import extend from '../js/function';

/**
 * @class Simplified Dijkstra's algorithm: all edges have a value of 1
 * @augments Path
 * @see Path
 */
export default function Dijkstra(toX, toY, passableCallback, options) {
  Path.call(this, toX, toY, passableCallback, options);

  this._computed = {};
  this._todo = [];
  this._add(toX, toY, null);
}
extend(Path, Dijkstra);

/**
 * Compute a path from a given point
 * @see Path#compute
 */
Dijkstra.prototype.compute = function compute(fromX, fromY, callback) {
  const key = `${fromX},${fromY}`;
  if (!this._computed.hasOwnProperty(key)) { this._compute(fromX, fromY); }
  if (!this._computed.hasOwnProperty(key)) { return; }

  let item = this._computed[key];
  while (item) {
    callback(item.x, item.y);
    item = item.prev;
  }
};

/**
 * Compute a non-cached value
 */
Dijkstra.prototype._compute = function _compute(fromX, fromY) {
  while (this._todo.length) {
    const item = this._todo.shift();
    if (item.x === fromX && item.y === fromY) { return; }

    const neighbors = this._getNeighbors(item.x, item.y);

    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const x = neighbor[0];
      const y = neighbor[1];
      const id = `${x},${y}`;
      if (!this._computed.hasOwnProperty(id)) this._add(x, y, item);
    }
  }
};

Dijkstra.prototype._add = function _add(x, y, prev) {
  const obj = {
    x,
    y,
    prev
  };
  this._computed[`${x},${y}`] = obj;
  this._todo.push(obj);
};
