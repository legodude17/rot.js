import Map from './map';
import extend from '../js/function';
import { getUniform } from '../rng';

/**
 * @class Maze generator - Eller's algorithm
 * See http://homepages.cwi.nl/~tromp/maze.html for explanation
 * @augments Map
 */
export default function EllerMaze(width, height) {
  Map.call(this, width, height);
}
extend(Map, EllerMaze);

EllerMaze.prototype.create = function create(callback) {
  const map = this._fillMap(1);
  const w = Math.ceil((this._width - 2) / 2);

  const rand = 9 / 24;

  const L = [];
  const R = [];

  for (let i = 0; i < w; i++) {
    L.push(i);
    R.push(i);
  }
  L.push(w - 1); /* fake stop-block at the right side */

  let j;
  for (j = 1; j + 3 < this._height; j += 2) {
    /* one row */
    for (let i = 0; i < w; i++) {
      /* cell coords (will be always empty) */
      const x = 2 * i + 1;
      const y = j;
      map[x][y] = 0;

      /* right connection */
      if (i !== L[i + 1] && getUniform() > rand) {
        this._addToList(i, L, R);
        map[x + 1][y] = 0;
      }

      /* bottom connection */
      if (i !== L[i] && getUniform() > rand) {
        /* remove connection */
        this._removeFromList(i, L, R);
      } else {
        /* create connection */
        map[x][y + 1] = 0;
      }
    }
  }

  /* last row */
  for (let i = 0; i < w; i++) {
    /* cell coords (will be always empty) */
    const x = 2 * i + 1;
    const y = j;
    map[x][y] = 0;

    /* right connection */
    if (i !== L[i + 1] && (i === L[i] || getUniform() > rand)) {
      /* dig right also if the cell is separated, so it gets connected to the rest of maze */
      this._addToList(i, L, R);
      map[x + 1][y] = 0;
    }

    this._removeFromList(i, L, R);
  }

  for (let i = 0; i < this._width; i++) {
    for (let j = 0; j < this._height; j++) {
      callback(i, j, map[i][j]);
    }
  }

  return this;
};

/**
 * Remove "i" from its list
 */
EllerMaze.prototype._removeFromList = function _removeFromList(i, L, R) {
  R[L[i]] = R[i];
  L[R[i]] = L[i];
  R[i] = i;
  L[i] = i;
};

/**
 * Join lists with "i" and "i+1"
 */
EllerMaze.prototype._addToList = function _addToList(i, L, R) {
  R[L[i + 1]] = R[i];
  L[R[i]] = L[i + 1];
  R[i] = i + 1;
  L[i + 1] = i;
};
