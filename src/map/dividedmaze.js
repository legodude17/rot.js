import Map from './map';
import extend from '../js/function';
import { pickRandom } from '../js/array';

/**
 * @class Recursively divided maze, http://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method
 * @augments Map
 */
export default function DividedMaze(width, height) {
  Map.call(this, width, height);
  this._stack = [];
}
extend(Map, DividedMaze);

DividedMaze.prototype.create = function create(callback) {
  const w = this._width;
  const h = this._height;

  this._map = [];

  for (let i = 0; i < w; i++) {
    this._map.push([]);
    for (let j = 0; j < h; j++) {
      const border = (i === 0 || j === 0 || i + 1 === w || j + 1 === h);
      this._map[i].push(border ? 1 : 0);
    }
  }

  this._stack = [
    [1, 1, w - 2, h - 2],
  ];
  this._process();

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      callback(i, j, this._map[i][j]);
    }
  }
  this._map = null;
  return this;
};

DividedMaze.prototype._process = function _process() {
  while (this._stack.length) {
    const room = this._stack.shift(); /* [left, top, right, bottom] */
    this._partitionRoom(room);
  }
};

DividedMaze.prototype._partitionRoom = function _partitionRoom(room) {
  const availX = [];
  const availY = [];

  for (let i = room[0] + 1; i < room[2]; i++) {
    const top = this._map[i][room[1] - 1];
    const bottom = this._map[i][room[3] + 1];
    if (top && bottom && !(i % 2)) { availX.push(i); }
  }

  for (let j = room[1] + 1; j < room[3]; j++) {
    const left = this._map[room[0] - 1][j];
    const right = this._map[room[2] + 1][j];
    if (left && right && !(j % 2)) { availY.push(j); }
  }

  if (!availX.length || !availY.length) { return; }

  const x = pickRandom(availX);
  const y = pickRandom(availY);

  this._map[x][y] = 1;

  const walls = [];

  let w = []; walls.push(w); /* left part */
  for (let i = room[0]; i < x; i++) {
    this._map[i][y] = 1;
    w.push([i, y]);
  }

  w = []; walls.push(w); /* right part */
  for (let i = x + 1; i <= room[2]; i++) {
    this._map[i][y] = 1;
    w.push([i, y]);
  }

  w = []; walls.push(w); /* top part */
  for (let j = room[1]; j < y; j++) {
    this._map[x][j] = 1;
    w.push([x, j]);
  }

  w = []; walls.push(w); /* bottom part */
  for (let j = y + 1; j <= room[3]; j++) {
    this._map[x][j] = 1;
    w.push([x, j]);
  }

  const solid = pickRandom(walls);
  for (let i = 0; i < walls.length; i++) {
    w = walls[i];
    if (w !== solid) {
      const hole = pickRandom(w);
      this._map[hole[0]][hole[1]] = 0;
    }
  }

  this._stack.push([room[0], room[1], x - 1, y - 1]); /* left top */
  this._stack.push([x + 1, room[1], room[2], y - 1]); /* right top */
  this._stack.push([room[0], y + 1, x - 1, room[3]]); /* left bottom */
  this._stack.push([x + 1, y + 1, room[2], room[3]]); /* right bottom */
};
