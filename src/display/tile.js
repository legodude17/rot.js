/**
 * @class Tile backend
 * @private
 */
ROT.Display.Tile = function (context) {
  ROT.Display.Rect.call(this, context);

  this._options = {};
  this._colorCanvas = document.createElement('canvas');
};
ROT.Display.Tile.extend(ROT.Display.Rect);

ROT.Display.Tile.prototype.compute = function (options) {
  this._options = options;
  this._context.canvas.width = options.width * options.tileWidth;
  this._context.canvas.height = options.height * options.tileHeight;
  this._colorCanvas.width = options.tileWidth;
  this._colorCanvas.height = options.tileHeight;
};

ROT.Display.Tile.prototype.draw = function (data, clearBefore) {
  const x = data[0];
  const y = data[1];
  const ch = data[2];
  var fg = data[3];
  var bg = data[4];

  const tileWidth = this._options.tileWidth;
  const tileHeight = this._options.tileHeight;

  if (clearBefore) {
    if (this._options.tileColorize) {
      this._context.clearRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
    } else {
      this._context.fillStyle = bg;
      this._context.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
    }
  }

  if (!ch) { return; }

  const chars = [].concat(ch);
  const fgs = [].concat(fg);
  const bgs = [].concat(bg);

  for (let i = 0; i < chars.length; i++) {
    const tile = this._options.tileMap[chars[i]];
    if (!tile) { throw new Error(`Char '${chars[i]}' not found in tileMap`); }

    if (this._options.tileColorize) { /* apply colorization */
      const canvas = this._colorCanvas;
      const context = canvas.getContext('2d');
      context.globalCompositeOperation = 'source-over';
      context.clearRect(0, 0, tileWidth, tileHeight);

      var fg = fgs[i];
      var bg = bgs[i];

      context.drawImage(
        this._options.tileSet,
        tile[0], tile[1], tileWidth, tileHeight,
        0, 0, tileWidth, tileHeight,
      );

      if (fg != 'transparent') {
        context.fillStyle = fg;
        context.globalCompositeOperation = 'source-atop';
        context.fillRect(0, 0, tileWidth, tileHeight);
      }

      if (bg != 'transparent') {
        context.fillStyle = bg;
        context.globalCompositeOperation = 'destination-over';
        context.fillRect(0, 0, tileWidth, tileHeight);
      }

      this._context.drawImage(canvas, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
    } else { /* no colorizing, easy */
      this._context.drawImage(
        this._options.tileSet,
        tile[0], tile[1], tileWidth, tileHeight,
        x * tileWidth, y * tileHeight, tileWidth, tileHeight,
      );
    }
  }
};

ROT.Display.Tile.prototype.computeSize = function (availWidth, availHeight) {
  const width = Math.floor(availWidth / this._options.tileWidth);
  const height = Math.floor(availHeight / this._options.tileHeight);
  return [width, height];
};

ROT.Display.Tile.prototype.computeFontSize = function (availWidth, availHeight) {
  const width = Math.floor(availWidth / this._options.width);
  const height = Math.floor(availHeight / this._options.height);
  return [width, height];
};

ROT.Display.Tile.prototype.eventToPosition = function (x, y) {
  return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
};
