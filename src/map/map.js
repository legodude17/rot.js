/**
 * @class Base map generator
 * @param {int} [width=ROT.DEFAULT_WIDTH]
 * @param {int} [height=ROT.DEFAULT_HEIGHT]
 */
ROT.Map = function (width, height) {
  this._width = width || ROT.DEFAULT_WIDTH;
  this._height = height || ROT.DEFAULT_HEIGHT;
};

ROT.Map.prototype.create = function (callback) {};

ROT.Map.prototype._fillMap = function (value) {
  const map = [];
  for (let i = 0; i < this._width; i++) {
    map.push([]);
    for (let j = 0; j < this._height; j++) { map[i].push(value); }
  }
  return map;
};
