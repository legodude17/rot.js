import Path from './path';
import { extend } from '../js/function';

/**
 * @class Simplified A* algorithm: all edges have a value of 1
 * @augments Path
 * @see Path
 */
export default function AStar(toX, toY, passableCallback, options) {
  Path.call(this, toX, toY, passableCallback, options);

  this._todo = [];
  this._done = {};
  this._fromX = null;
  this._fromY = null;
}
extend(Path, AStar);

/**
 * Compute a path from a given point
 * @see Path#compute
 */
AStar.prototype.compute = function compute(fromX, fromY, callback) {
  this._todo = [];
  this._done = {};
  this._fromX = fromX;
  this._fromY = fromY;
  this._add(this._toX, this._toY, null);

  while (this._todo.length) {
    const item = this._todo.shift();
    let id = `${item.x},${item.y}`;
    if (!this._done.hasOwnProperty(id)) {
      this._done[id] = item;
      if (item.x === fromX && item.y === fromY) { break; }

      const neighbors = this._getNeighbors(item.x, item.y);

      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        const x = neighbor[0];
        const y = neighbor[1];
        id = `${x},${y}`;
        if (!this._done.hasOwnProperty(id)) this._add(x, y, item);
      }
    }
  }

  let item = this._done[`${fromX},${fromY}`];
  if (!item) { return; }

  while (item) {
    callback(item.x, item.y);
    item = item.prev;
  }
};

AStar.prototype._add = function _add(x, y, prev) {
  const h = this._distance(x, y);
  const obj = {
    x,
    y,
    prev,
    g: (prev ? prev.g + 1 : 0),
    h
  };

  /* insert into priority queue */

  const f = obj.g + obj.h;
  for (let i = 0; i < this._todo.length; i++) {
    const item = this._todo[i];
    const itemF = item.g + item.h;
    if (f < itemF || (f === itemF && h < item.h)) {
      this._todo.splice(i, 0, obj);
      return;
    }
  }

  this._todo.push(obj);
};

AStar.prototype._distance = function _distance(x, y) {
  switch (this._options.topology) {
  case 4:
    return (Math.abs(x - this._fromX) + Math.abs(y - this._fromY));

  case 6: {
    const dx = Math.abs(x - this._fromX);
    const dy = Math.abs(y - this._fromY);
    return dy + Math.max(0, (dx - dy) / 2);
  }

  case 8:
    return Math.max(Math.abs(x - this._fromX), Math.abs(y - this._fromY));

  default: throw new Error('Illegal topology');
  }
};
