import Map from './map';
import extend from '../js/function';

/**
 * @class Simple empty rectangular room
 * @augments Map
 */
export default function Arena(width, height) {
  Map.call(this, width, height);
}
extend(Map, Arena);

Arena.prototype.create = function create(callback) {
  const w = this._width - 1;
  const h = this._height - 1;
  for (let i = 0; i <= w; i++) {
    for (let j = 0; j <= h; j++) {
      const empty = (i && j && i < w && j < h);
      callback(i, j, empty ? 0 : 1);
    }
  }
  return this;
};
