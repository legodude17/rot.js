/**
 * @class Simple empty rectangular room
 * @augments ROT.Map
 */
ROT.Map.Arena = function (width, height) {
  ROT.Map.call(this, width, height);
};
ROT.Map.Arena.extend(ROT.Map);

ROT.Map.Arena.prototype.create = function (callback) {
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
