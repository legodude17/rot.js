import Map from './map';
import { extend } from '../js/function';
import { DIRS } from '../rot';
import { getUniform, getUniformInt } from '../rng';

/**
 * @class Cellular automaton map generator
 * @augments Map
 * @param {int} [width=DEFAULT_WIDTH]
 * @param {int} [height=DEFAULT_HEIGHT]
 * @param {object} [options] Options
 * @param {int[]} [options.born] List of neighbor counts for a new cell to be born in empty space
 * @param {int[]} [options.survive] List of neighbor counts for an existing  cell to survive
 * @param {int} [options.topology] Topology 4 or 6 or 8
 */
export default function CellularMap(width, height, options) {
  Map.call(this, width, height);
  this._options = {
    born: [5, 6, 7, 8],
    survive: [4, 5, 6, 7, 8],
    topology: 8
  };
  this.setOptions(options);

  this._dirs = DIRS[this._options.topology];
  this._map = this._fillMap(0);
}
extend(Map, CellularMap);

/**
 * Fill the map with random values
 * @param {float} probability Probability for a cell to become alive; 0 = all empty, 1 = all full
 */
CellularMap.prototype.randomize = function randomize(probability) {
  for (let i = 0; i < this._width; i++) {
    for (let j = 0; j < this._height; j++) {
      this._map[i][j] = (getUniform() < probability ? 1 : 0);
    }
  }
  return this;
};

/**
 * Change options.
 * @see CellularMap
 */
CellularMap.prototype.setOptions = function setOptions(options) {
  Object.assign(this._options, options);
};

CellularMap.prototype.set = function set(x, y, value) {
  this._map[x][y] = value;
};

CellularMap.prototype.create = function create(callback) {
  const newMap = this._fillMap(0);
  const { born, survive } = this._options;


  for (let j = 0; j < this._height; j++) {
    let widthStep = 1;
    let widthStart = 0;
    if (this._options.topology === 6) {
      widthStep = 2;
      widthStart = j % 2;
    }

    for (let i = widthStart; i < this._width; i += widthStep) {
      const cur = this._map[i][j];
      const ncount = this._getNeighbors(i, j);

      if (cur && survive.indexOf(ncount) !== -1) { /* survive */
        newMap[i][j] = 1;
      } else if (!cur && born.indexOf(ncount) !== -1) { /* born */
        newMap[i][j] = 1;
      }
    }
  }

  this._map = newMap;
  if (callback) this._serviceCallback(callback);
};

CellularMap.prototype._serviceCallback = function _serviceCallback(callback) {
  for (let j = 0; j < this._height; j++) {
    let widthStep = 1;
    let widthStart = 0;
    if (this._options.topology === 6) {
      widthStep = 2;
      widthStart = j % 2;
    }
    for (let i = widthStart; i < this._width; i += widthStep) {
      callback(i, j, this._map[i][j]);
    }
  }
};

/**
 * Get neighbor count at [i,j] in this._map
 */
CellularMap.prototype._getNeighbors = function _getNeighbors(cx, cy) {
  let result = 0;
  for (let i = 0; i < this._dirs.length; i++) {
    const dir = this._dirs[i];
    const x = cx + dir[0];
    const y = cy + dir[1];

    if (!(x < 0 || x >= this._width || y < 0 || y >= this._height)) result += (this._map[x][y] === 1 ? 1 : 0);
  }

  return result;
};

/**
 * Make sure every non-wall space is accessible.
 * @param {function} callback to call to display map when do
 * @param {int} value to consider empty space - defaults to 0
 * @param {function} callback to call when a new connection is made
 */
CellularMap.prototype.connect = function connect(callback, value, connectionCallback) {
  if (!value) value = 0;

  const allFreeSpace = [];
  const notConnected = {};

  // find all free space
  let widthStep = 1;
  let widthStarts = [0, 0];
  if (this._options.topology === 6) {
    widthStep = 2;
    widthStarts = [0, 1];
  }
  for (let y = 0; y < this._height; y++) {
    for (let x = widthStarts[y % 2]; x < this._width; x += widthStep) {
      if (this._freeSpace(x, y, value)) {
        const p = [x, y];
        notConnected[this._pointKey(p)] = p;
        allFreeSpace.push([x, y]);
      }
    }
  }
  const start = allFreeSpace[getUniformInt(0, allFreeSpace.length - 1)];

  const key = this._pointKey(start);
  const connected = {};
  connected[key] = start;
  delete notConnected[key];

  // find what's connected to the starting point
  this._findConnected(connected, notConnected, [start], false, value);

  while (Object.keys(notConnected).length > 0) {
    // find two points from notConnected to connected
    const p = this._getFromTo(connected, notConnected);
    const from = p[0]; // notConnected
    const to = p[1]; // connected

    // find everything connected to the starting point
    const local = {};
    local[this._pointKey(from)] = from;
    this._findConnected(local, notConnected, [from], true, value);

    // connect to a connected cell
    const tunnelFn = (this._options.topology === 6 ? this._tunnelToConnected6 : this._tunnelToConnected);
    tunnelFn.call(this, to, from, connected, notConnected, value, connectionCallback);

    // now all of local is connected
    for (const k in local) {
      if (local.hasOwnProperty(k)) {
        const pp = local[k];
        this._map[pp[0]][pp[1]] = value;
        connected[k] = pp;
        delete notConnected[k];
      }
    }
  }

  if (callback) this._serviceCallback(callback);
};

/**
 * Find random points to connect. Search for the closest point in the larger space.
 * This is to minimize the length of the passage while maintaining good performance.
 */
CellularMap.prototype._getFromTo = function _getFromTo(connected, notConnected) {
  let from; let to; let
    d;
  const connectedKeys = Object.keys(connected);
  const notConnectedKeys = Object.keys(notConnected);
  for (let i = 0; i < 5; i++) {
    if (connectedKeys.length < notConnectedKeys.length) {
      const keys = connectedKeys;
      to = connected[keys[getUniformInt(0, keys.length - 1)]];
      from = this._getClosest(to, notConnected);
    } else {
      const keys = notConnectedKeys;
      from = notConnected[keys[getUniformInt(0, keys.length - 1)]];
      to = this._getClosest(from, connected);
    }
    d = (from[0] - to[0]) * (from[0] - to[0]) + (from[1] - to[1]) * (from[1] - to[1]);
    if (d < 64) {
      break;
    }
  }
  // console.log(">>> connected=" + to + " notConnected=" + from + " dist=" + d);
  return [from, to];
};

CellularMap.prototype._getClosest = function _getClosest(point, space) {
  let minPoint = null;
  let minDist = null;
  for (const k in space) {
    if (space.hasOwnProperty(k)) {
      const p = space[k];
      const d = (p[0] - point[0]) * (p[0] - point[0]) + (p[1] - point[1]) * (p[1] - point[1]);
      if (minDist == null || d < minDist) {
        minDist = d;
        minPoint = p;
      }
    }
  }
  return minPoint;
};

CellularMap.prototype._findConnected = function _findConnected(connected, notConnected, stack, keepNotConnected, value) {
  while (stack.length > 0) {
    const p = stack.splice(0, 1)[0];
    let tests;

    if (this._options.topology === 6) {
      tests = [
        [p[0] + 2, p[1]],
        [p[0] + 1, p[1] - 1],
        [p[0] - 1, p[1] - 1],
        [p[0] - 2, p[1]],
        [p[0] - 1, p[1] + 1],
        [p[0] + 1, p[1] + 1]
      ];
    } else {
      tests = [
        [p[0] + 1, p[1]],
        [p[0] - 1, p[1]],
        [p[0], p[1] + 1],
        [p[0], p[1] - 1]
      ];
    }

    for (let i = 0; i < tests.length; i++) {
      const key = this._pointKey(tests[i]);
      if (connected[key] == null && this._freeSpace(tests[i][0], tests[i][1], value)) {
        connected[key] = tests[i];
        if (!keepNotConnected) {
          delete notConnected[key];
        }
        stack.push(tests[i]);
      }
    }
  }
};

CellularMap.prototype._tunnelToConnected = function _tunnelToConnected(to, from, connected, notConnected, value, connectionCallback) {
  let a; let
    b;
  if (from[0] < to[0]) {
    a = from;
    b = to;
  } else {
    a = to;
    b = from;
  }
  for (let xx = a[0]; xx <= b[0]; xx++) {
    this._map[xx][a[1]] = value;
    const p = [xx, a[1]];
    const pkey = this._pointKey(p);
    connected[pkey] = p;
    delete notConnected[pkey];
  }
  if (connectionCallback && a[0] < b[0]) {
    connectionCallback(a, [b[0], a[1]]);
  }

  // x is now fixed
  const x = b[0];

  if (from[1] < to[1]) {
    a = from;
    b = to;
  } else {
    a = to;
    b = from;
  }
  for (let yy = a[1]; yy < b[1]; yy++) {
    this._map[x][yy] = value;
    const p = [x, yy];
    const pkey = this._pointKey(p);
    connected[pkey] = p;
    delete notConnected[pkey];
  }
  if (connectionCallback && a[1] < b[1]) { connectionCallback([b[0], a[1]], [b[0], b[1]]); }
};

CellularMap.prototype._tunnelToConnected6 = function _tunnelToConnected6(to, from, connected, notConnected, value, connectionCallback) {
  let a; let
    b;
  if (from[0] < to[0]) {
    a = from;
    b = to;
  } else {
    a = to;
    b = from;
  }

  // tunnel diagonally until horizontally level
  let xx = a[0];
  let yy = a[1];
  while (!(xx === b[0] && yy === b[1])) {
    let stepWidth = 2;
    if (yy < b[1]) {
      yy++;
      stepWidth = 1;
    } else if (yy > b[1]) {
      yy--;
      stepWidth = 1;
    }
    if (xx < b[0]) {
      xx += stepWidth;
    } else if (xx > b[0]) {
      xx -= stepWidth;
    } else if (b[1] % 2) {
      // Won't step outside map if destination on is map's right edge
      xx -= stepWidth;
    } else {
      // ditto for left edge
      xx += stepWidth;
    }
    this._map[xx][yy] = value;
    const p = [xx, yy];
    const pkey = this._pointKey(p);
    connected[pkey] = p;
    delete notConnected[pkey];
  }

  if (connectionCallback) { connectionCallback(from, to); }
};

CellularMap.prototype._freeSpace = function _freeSpace(x, y, value) {
  return x >= 0 && x < this._width && y >= 0 && y < this._height && this._map[x][y] === value;
};

CellularMap.prototype._pointKey = function _pointKey(p) {
  return `${p[0]}.${p[1]}`;
};
