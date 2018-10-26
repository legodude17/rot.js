import XY from './xy';

export default function TextBuffer() {
  this._data = [];
  this._options = {
    display: null,
    position: new XY(),
    size: new XY()
  };
}

TextBuffer.prototype.configure = function configure(options) {
  Object.assign(this._options, options);
};

TextBuffer.prototype.clear = function clear() {
  this._data = [];
};

TextBuffer.prototype.write = function write(text) {
  this._data.push(text);
};

TextBuffer.prototype.flush = function flush() {
  const o = this._options;
  const { size, position: pos, display: d } = o;

  /* clear */
  for (let i = 0; i < size.x; i++) {
    for (let j = 0; j < size.y; j++) {
      d.draw(pos.x + i, pos.y + j);
    }
  }

  const text = this._data.join(' ');
  d.drawText(pos.x, pos.y, text, size.x);
};
