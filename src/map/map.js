/**
 * @class Base map generator
 * @param {int} [width=DEFAULT_WIDTH]
 * @param {int} [height=DEFAULT_HEIGHT]
 */
export default function Map(width, height) {
  this._width = width;
  this._height = height;
}

Map.prototype.create = function create(callback) {}; // eslint-disable-line no-unused-vars

Map.prototype._fillMap = function _fillMap(value) {
  const map = [];
  for (let i = 0; i < this._width; i++) {
    map.push([]);
    for (let j = 0; j < this._height; j++) { map[i].push(value); }
  }
  return map;
};
