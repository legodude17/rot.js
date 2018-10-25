import { DIRS } from '../rot';

/**
 * @class Abstract pathfinder
 * @param {int} toX Target X coord
 * @param {int} toY Target Y coord
 * @param {function} passableCallback Callback to determine map passability
 * @param {object} [options]
 * @param {int} [options.topology=8]
 */
export default function Path(toX, toY, passableCallback, options) {
  this._toX = toX;
  this._toY = toY;
  this._fromX = null;
  this._fromY = null;
  this._passableCallback = passableCallback;
  this._options = {
    topology: 8
  };
  Object.assign(this._options, options);

  this._dirs = DIRS[this._options.topology];
  if (this._options.topology === 8) { /* reorder dirs for more aesthetic result (vertical/horizontal first) */
    this._dirs = [
      this._dirs[0],
      this._dirs[2],
      this._dirs[4],
      this._dirs[6],
      this._dirs[1],
      this._dirs[3],
      this._dirs[5],
      this._dirs[7]
    ];
  }
}

/**
 * Compute a path from a given point
 * @param {int} fromX
 * @param {int} fromY
 * @param {function} callback Will be called for every path item with arguments "x" and "y"
 */
Path.prototype.compute = function compute(fromX, fromY, callback) { // eslint-disable-line no-unused-vars
};

Path.prototype._getNeighbors = function _getNeighbors(cx, cy) {
  const result = [];
  for (let i = 0; i < this._dirs.length; i++) {
    const dir = this._dirs[i];
    const x = cx + dir[0];
    const y = cy + dir[1];

    if (this._passableCallback(x, y)) result.push([x, y]);
  }

  return result;
};
