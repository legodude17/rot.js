import {
  tokenize, TYPE_TEXT, TYPE_BG, TYPE_FG, TYPE_NEWLINE,
} from '../text';

import HexDisplayBackend from './hex';
import RectDisplayBackend from './rect';
import TileDisplayBackend from './tile';

/**
 * @class Visual map display
 * @param {object} [options]
 * @param {int} [options.width=DEFAULT_WIDTH]
 * @param {int} [options.height=DEFAULT_HEIGHT]
 * @param {int} [options.fontSize=15]
 * @param {string} [options.fontFamily="monospace"]
 * @param {string} [options.fontStyle=""] bold/italic/none/both
 * @param {string} [options.fg="#ccc"]
 * @param {string} [options.bg="#000"]
 * @param {float} [options.spacing=1]
 * @param {float} [options.border=0]
 * @param {string} [options.layout="rect"]
 * @param {bool} [options.forceSquareRatio=false]
 * @param {int} [options.tileWidth=32]
 * @param {int} [options.tileHeight=32]
 * @param {object} [options.tileMap={}]
 * @param {image} [options.tileSet=null]
 * @param {image} [options.tileColorize=false]
 */
export default function Display(options) {
  const canvas = document.createElement('canvas');
  this._context = canvas.getContext('2d');
  this._data = {};
  this._dirty = false; /* false = nothing, true = all, object = dirty cells */
  this._options = {};
  this._backend = null;

  const defaultOptions = {
    transpose: false,
    layout: 'rect',
    fontSize: 15,
    spacing: 1,
    border: 0,
    forceSquareRatio: false,
    fontFamily: 'monospace',
    fontStyle: '',
    fg: '#ccc',
    bg: '#000',
    tileWidth: 32,
    tileHeight: 32,
    tileMap: {},
    tileSet: null,
    tileColorize: false,
    termColor: 'xterm',
  };
  Object.assign(defaultOptions, options);
  this.setOptions(defaultOptions);
  this.DEBUG = this.DEBUG.bind(this);

  this._tick = this._tick.bind(this);
  requestAnimationFrame(this._tick);
}

/**
 * Debug helper, ideal as a map generator callback. Always bound to this.
 * @param {int} x
 * @param {int} y
 * @param {int} what
 */
Display.prototype.DEBUG = function DEBUG(x, y, what) {
  const colors = [this._options.bg, this._options.fg];
  this.draw(x, y, null, null, colors[what % colors.length]);
};

/**
 * Clear the whole display (cover it with background color)
 */
Display.prototype.clear = function clear() {
  this._data = {};
  this._dirty = true;
};

/**
 * @see Display
 */
Display.prototype.setOptions = function setOptions(options) {
  Object.assign(this._options, options);
  if (options.width || options.height || options.fontSize || options.fontFamily || options.spacing || options.layout) {
    if (options.layout) {
      const Backend = this._getBackend(options.layout.toLowerCase());
      this._backend = new Backend(this._context);
    }

    const font = `${(this._options.fontStyle
      ? `${this._options.fontStyle} `
      : '') + this._options.fontSize}px ${this._options.fontFamily}`;
    this._context.font = font;
    this._backend.compute(this._options);
    this._context.font = font;
    this._context.textAlign = 'center';
    this._context.textBaseline = 'middle';
    this._dirty = true;
  }
  return this;
};

Display.prototype._getBackend = function _getBackend(name) {
  switch (name) {
  case 'hex':
    return HexDisplayBackend;
  case 'rect':
    return RectDisplayBackend;
  case 'tile':
    return TileDisplayBackend;
  default: throw new Error('Unrecognized backend');
  }
};

/**
 * Returns currently set options
 * @returns {object} Current options object
 */
Display.prototype.getOptions = function getOptions() {
  return this._options;
};

/**
 * Returns the DOM node of this display
 * @returns {node} DOM node
 */
Display.prototype.getContainer = function getContainer() {
  return this._context.canvas;
};

/**
 * Compute the maximum width/height to fit into a set of given constraints
 * @param {int} availWidth Maximum allowed pixel width
 * @param {int} availHeight Maximum allowed pixel height
 * @returns {int[2]} cellWidth,cellHeight
 */
Display.prototype.computeSize = function computeSize(availWidth, availHeight) {
  return this._backend.computeSize(availWidth, availHeight, this._options);
};

/**
 * Compute the maximum font size to fit into a set of given constraints
 * @param {int} availWidth Maximum allowed pixel width
 * @param {int} availHeight Maximum allowed pixel height
 * @returns {int} fontSize
 */
Display.prototype.computeFontSize = function computeFontSize(availWidth, availHeight) {
  return this._backend.computeFontSize(availWidth, availHeight, this._options);
};

/**
 * Convert a DOM event (mouse or touch) to map coordinates. Uses first touch for multi-touch.
 * @param {Event} e event
 * @returns {int[2]} -1 for values outside of the canvas
 */
Display.prototype.eventToPosition = function eventToPosition(e) {
  let x;
  let y;
  if (e.touches) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  const rect = this._context.canvas.getBoundingClientRect();
  x -= rect.left;
  y -= rect.top;

  x *= this._context.canvas.width / rect.width;
  y *= this._context.canvas.height / rect.height;

  if (x < 0 || y < 0 || x >= this._context.canvas.width || y >= this._context.canvas.height) { return [-1, -1]; }

  return this._backend.eventToPosition(x, y);
};

/**
 * @param {int} x
 * @param {int} y
 * @param {string || string[]} ch One or more chars (will be overlapping themselves)
 * @param {string} [fg] foreground color
 * @param {string} [bg] background color
 */
Display.prototype.draw = function draw(x, y, ch, fg, bg) {
  if (!fg) { ({ fg } = this._options); }
  if (!bg) { ({ bg } = this._options); }
  this._data[`${x},${y}`] = [x, y, ch, fg, bg];

  if (this._dirty === true) { return; } /* will already redraw everything */
  if (!this._dirty) { this._dirty = {}; } /* first! */
  this._dirty[`${x},${y}`] = true;
};

/**
 * Draws a text at given position. Optionally wraps at a maximum length. Currently does not work with hex layout.
 * @param {int} x
 * @param {int} y
 * @param {string} text May contain color/background format specifiers, %c{name}/%b{name}, both optional. %c{}/%b{} resets to default.
 * @param {int} [maxWidth] wrap at what width?
 * @returns {int} lines drawn
 */
Display.prototype.drawText = function drawText(x, y, text, maxWidth) {
  let fg = null;
  let bg = null;
  let cx = x;
  let cy = y;
  let lines = 1;
  if (!maxWidth) { maxWidth = this._options.width - x; }

  const tokens = tokenize(text, maxWidth);

  while (tokens.length) { /* interpret tokenized opcode stream */
    const token = tokens.shift();
    switch (token.type) {
    case TYPE_TEXT: {
      let isSpace = false;
      let isPrevSpace = false;
      let isFullWidth = false;
      let isPrevFullWidth = false;
      for (let i = 0; i < token.value.length; i++) {
        const cc = token.value.charCodeAt(i);
        const c = token.value.charAt(i);
        // Assign to `true` when the current char is full-width.
        isFullWidth = (cc > 0xff00 && cc < 0xff61) || (cc > 0xffdc && cc < 0xffe8) || cc > 0xffee;
        // Current char is space, whatever full-width or half-width both are OK.
        isSpace = (c.charCodeAt(0) === 0x20 || c.charCodeAt(0) === 0x3000);
        // The previous char is full-width and
        // current char is nether half-width nor a space.
        if (isPrevFullWidth && !isFullWidth && !isSpace) { cx++; } // add an extra position
        // The current char is full-width and
        // the previous char is not a space.
        if (isFullWidth && !isPrevSpace) { cx++; } // add an extra position
        this.draw(cx++, cy, c, fg, bg);
        isPrevSpace = isSpace;
        isPrevFullWidth = isFullWidth;
      }
      break;
    }

    case TYPE_FG:
      fg = token.value || null;
      break;

    case TYPE_BG:
      bg = token.value || null;
      break;

    case TYPE_NEWLINE:
      cx = x;
      cy++;
      lines++;
      break;

    default: break;
    }
  }

  return lines;
};

/**
 * Timer tick: update dirty parts
 */
Display.prototype._tick = function _tick() {
  requestAnimationFrame(this._tick);

  if (!this._dirty) { return; }

  if (this._dirty === true) { /* draw all */
    this._context.fillStyle = this._options.bg;
    this._context.fillRect(0, 0, this._context.canvas.width, this._context.canvas.height);

    for (const id in this._data) { /* redraw cached data */
      if (this._data.hasOwnProperty(id)) {
        this._draw(id, false);
      }
    }
  } else { /* draw only dirty */
    for (const key in this._dirty) {
      if (this._dirty.hasOwnProperty(key)) {
        this._draw(key, true);
      }
    }
  }

  this._dirty = false;
};

/**
 * @param {string} key What to draw
 * @param {bool} clearBefore Is it necessary to clean before?
 */
Display.prototype._draw = function _draw(key, clearBefore) {
  const data = this._data[key];
  if (data[4] !== this._options.bg) { clearBefore = true; }

  this._backend.draw(data, clearBefore);
};
