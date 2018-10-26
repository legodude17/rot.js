import extend from '../js/function';
import { getUniform, getUniformInt } from '../rng';

/**
 * @class Dungeon feature; has own .create() method
 */
export function Feature() {}
/* eslint-disable no-unused-vars */
Feature.prototype.isValid = function isValid(canBeDugCallback) {};
Feature.prototype.create = function create(digCallback) {};
Feature.prototype.debug = function debug() {};
Feature.createRandomAt = function createRandomAt(x, y, dx, dy, options) {};
/* eslint-enable */

/**
 * @class Room
 * @augments Feature
 * @param {int} x1
 * @param {int} y1
 * @param {int} x2
 * @param {int} y2
 * @param {int} [doorX]
 * @param {int} [doorY]
 */
export function Room(x1, y1, x2, y2, doorX, doorY) {
  this._x1 = x1;
  this._y1 = y1;
  this._x2 = x2;
  this._y2 = y2;
  this._doors = {};
  if (arguments.length > 4) { this.addDoor(doorX, doorY); }
}
extend(Feature, Room);

/**
 * Room of random size, with a given doors and direction
 */
Room.createRandomAt = function createRandomAt(x, y, dx, dy, options) {
  let [min, max] = options.roomWidth;
  const width = getUniformInt(min, max);

  [min, max] = options.roomHeight;
  const height = getUniformInt(min, max);

  if (dx === 1) { /* to the right */
    const y2 = y - Math.floor(getUniform() * height);
    return new this(x + 1, y2, x + width, y2 + height - 1, x, y);
  }

  if (dx === -1) { /* to the left */
    const y2 = y - Math.floor(getUniform() * height);
    return new this(x - width, y2, x - 1, y2 + height - 1, x, y);
  }

  if (dy === 1) { /* to the bottom */
    const x2 = x - Math.floor(getUniform() * width);
    return new this(x2, y + 1, x2 + width - 1, y + height, x, y);
  }

  if (dy === -1) { /* to the top */
    const x2 = x - Math.floor(getUniform() * width);
    return new this(x2, y - height, x2 + width - 1, y - 1, x, y);
  }

  throw new Error('dx or dy must be 1 or -1');
};

/**
 * Room of random size, positioned around center coords
 */
Room.createRandomCenter = function createRandomCenter(cx, cy, options) {
  let [min, max] = options.roomWidth;
  const width = getUniformInt(min, max);

  [min, max] = options.roomHeight;
  const height = getUniformInt(min, max);

  const x1 = cx - Math.floor(getUniform() * width);
  const y1 = cy - Math.floor(getUniform() * height);
  const x2 = x1 + width - 1;
  const y2 = y1 + height - 1;

  return new this(x1, y1, x2, y2);
};

/**
 * Room of random size within a given dimensions
 */
Room.createRandom = function createRandom(availWidth, availHeight, options) {
  let [min, max] = options.roomWidth;
  const width = getUniformInt(min, max);

  [min, max] = options.roomHeight;
  const height = getUniformInt(min, max);

  const left = availWidth - width - 1;
  const top = availHeight - height - 1;

  const x1 = 1 + Math.floor(getUniform() * left);
  const y1 = 1 + Math.floor(getUniform() * top);
  const x2 = x1 + width - 1;
  const y2 = y1 + height - 1;

  return new this(x1, y1, x2, y2);
};

Room.prototype.addDoor = function addDoor(x, y) {
  this._doors[`${x},${y}`] = 1;
  return this;
};

/**
 * @param {function}
 */
Room.prototype.getDoors = function getDoors(callback) {
  for (const key in this._doors) {
    if (this._doors.hasOwnProperty(key)) {
      const parts = key.split(',');
      callback(parseInt(parts[0], 10), parseInt(parts[1], 10));
    }
  }
  return this;
};

Room.prototype.clearDoors = function cleanDoors() {
  this._doors = {};
  return this;
};

Room.prototype.addDoors = function addDors(isWallCallback) {
  const left = this._x1 - 1;
  const right = this._x2 + 1;
  const top = this._y1 - 1;
  const bottom = this._y2 + 1;

  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      if (!((x !== left && x !== right && y !== top && y !== bottom) || isWallCallback(x, y))) this.addDoor(x, y);
    }
  }

  return this;
};

Room.prototype.debug = function debug() {
  console.log('room', this._x1, this._y1, this._x2, this._y2); // eslint-disable-line no-console
};

Room.prototype.isValid = function isValid(isWallCallback, canBeDugCallback) {
  const left = this._x1 - 1;
  const right = this._x2 + 1;
  const top = this._y1 - 1;
  const bottom = this._y2 + 1;

  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      if (x === left || x === right || y === top || y === bottom) {
        if (!isWallCallback(x, y)) { return false; }
      } else if (!canBeDugCallback(x, y)) { return false; }
    }
  }

  return true;
};

/**
 * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty, 1 = wall, 2 = door. Multiple doors are allowed.
 */
Room.prototype.create = function create(digCallback) {
  const left = this._x1 - 1;
  const right = this._x2 + 1;
  const top = this._y1 - 1;
  const bottom = this._y2 + 1;

  let value = 0;
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      if (this._doors.hasOwnProperty(`${x},${y}`)) {
        value = 2;
      } else if (x === left || x === right || y === top || y === bottom) {
        value = 1;
      } else {
        value = 0;
      }
      digCallback(x, y, value);
    }
  }
};

Room.prototype.getCenter = function getCenter() {
  return [Math.round((this._x1 + this._x2) / 2), Math.round((this._y1 + this._y2) / 2)];
};

Room.prototype.getLeft = function getLeft() {
  return this._x1;
};

Room.prototype.getRight = function getRight() {
  return this._x2;
};

Room.prototype.getTop = function getTop() {
  return this._y1;
};

Room.prototype.getBottom = function getBottom() {
  return this._y2;
};

/**
 * @class Corridor
 * @augments Feature
 * @param {int} startX
 * @param {int} startY
 * @param {int} endX
 * @param {int} endY
 */
export function Corridor(startX, startY, endX, endY) {
  this._startX = startX;
  this._startY = startY;
  this._endX = endX;
  this._endY = endY;
  this._endsWithAWall = true;
}
extend(Feature, Corridor);

Corridor.createRandomAt = function createRandomAt(x, y, dx, dy, options) {
  const min = options.corridorLength[0];
  const max = options.corridorLength[1];
  const length = getUniformInt(min, max);

  return new this(x, y, x + dx * length, y + dy * length);
};

Corridor.prototype.debug = function debug() {
  console.log('corridor', this._startX, this._startY, this._endX, this._endY); // eslint-disable-line no-console
};

Corridor.prototype.isValid = function isValid(isWallCallback, canBeDugCallback) {
  const sx = this._startX;
  const sy = this._startY;
  let dx = this._endX - sx;
  let dy = this._endY - sy;
  let length = 1 + Math.max(Math.abs(dx), Math.abs(dy));

  if (dx) { dx /= Math.abs(dx); }
  if (dy) { dy /= Math.abs(dy); }
  const nx = dy;
  const ny = -dx;

  let ok = true;
  for (let i = 0; i < length; i++) {
    const x = sx + i * dx;
    const y = sy + i * dy;

    if (!canBeDugCallback(x, y)) { ok = false; }
    if (!isWallCallback(x + nx, y + ny)) { ok = false; }
    if (!isWallCallback(x - nx, y - ny)) { ok = false; }

    if (!ok) {
      length = i;
      this._endX = x - dx;
      this._endY = y - dy;
      break;
    }
  }

  /**
   * If the length degenerated, this corridor might be invalid
   */

  /* not supported */
  if (length === 0) { return false; }

  /* length 1 allowed only if the next space is empty */
  if (length === 1 && isWallCallback(this._endX + dx, this._endY + dy)) { return false; }

  /**
   * We do not want the corridor to crash into a corner of a room;
   * if any of the ending corners is empty, the N+1th cell of this corridor must be empty too.
   *
   * Situation:
   * #######1
   * .......?
   * #######2
   *
   * The corridor was dug from left to right.
   * 1, 2 - problematic corners, ? = N+1th cell (not dug)
   */
  const firstCornerBad = !isWallCallback(this._endX + dx + nx, this._endY + dy + ny);
  const secondCornerBad = !isWallCallback(this._endX + dx - nx, this._endY + dy - ny);
  this._endsWithAWall = isWallCallback(this._endX + dx, this._endY + dy);
  if ((firstCornerBad || secondCornerBad) && this._endsWithAWall) { return false; }

  return true;
};

/**
 * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty.
 */
Corridor.prototype.create = function create(digCallback) {
  const sx = this._startX;
  const sy = this._startY;
  let dx = this._endX - sx;
  let dy = this._endY - sy;
  const length = 1 + Math.max(Math.abs(dx), Math.abs(dy));

  if (dx) { dx /= Math.abs(dx); }
  if (dy) { dy /= Math.abs(dy); }

  for (let i = 0; i < length; i++) {
    const x = sx + i * dx;
    const y = sy + i * dy;
    digCallback(x, y, 0);
  }

  return true;
};

Corridor.prototype.createPriorityWalls = function createPriorityWalls(priorityWallCallback) {
  if (!this._endsWithAWall) { return; }

  const sx = this._startX;
  const sy = this._startY;

  let dx = this._endX - sx;
  let dy = this._endY - sy;
  if (dx) { dx /= Math.abs(dx); }
  if (dy) { dy /= Math.abs(dy); }
  const nx = dy;
  const ny = -dx;

  priorityWallCallback(this._endX + dx, this._endY + dy);
  priorityWallCallback(this._endX + nx, this._endY + ny);
  priorityWallCallback(this._endX - nx, this._endY - ny);
};
