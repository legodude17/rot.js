(function () {
  'use strict';

  /**
   * @class Generic event queue: stores events and retrieves them based on their time
   */
  function EventQueue() {
    this._time = 0;
    this._events = [];
    this._eventTimes = [];
  }

  /**
   * @returns {number} Elapsed time
   */
  EventQueue.prototype.getTime = function getTime() {
    return this._time;
  };

  /**
   * Clear all scheduled events
   */
  EventQueue.prototype.clear = function clear() {
    this._events = [];
    this._eventTimes = [];
    return this;
  };

  /**
   * @param {?} event
   * @param {number} time
   */
  EventQueue.prototype.add = function add(event, time) {
    let index = this._events.length;
    for (let i = 0; i < this._eventTimes.length; i++) {
      if (this._eventTimes[i] > time) {
        index = i;
        break;
      }
    }

    this._events.splice(index, 0, event);
    this._eventTimes.splice(index, 0, time);
  };

  /**
   * Locates the nearest event, advances time if necessary. Returns that event and removes it from the queue.
   * @returns {? || null} The event previously added by addEvent, null if no event available
   */
  EventQueue.prototype.get = function get() {
    if (!this._events.length) { return null; }

    const time = this._eventTimes.splice(0, 1)[0];
    if (time > 0) { /* advance */
      this._time += time;
      for (let i = 0; i < this._eventTimes.length; i++) { this._eventTimes[i] -= time; }
    }

    return this._events.splice(0, 1)[0];
  };

  /**
   * Get the time associated with the given event
   * @param {?} event
   * @returns {number} time
   */
  EventQueue.prototype.getEventTime = function getEventTime(event) {
    const index = this._events.indexOf(event);
    if (index === -1) { return undefined; }
    return this._eventTimes[index];
  };

  /**
   * Remove an event from the queue
   * @param {?} event
   * @returns {bool} success?
   */
  EventQueue.prototype.remove = function remove(event) {
    const index = this._events.indexOf(event);
    if (index === -1) { return false; }
    this._remove(index);
    return true;
  };

  /**
   * Remove an event from the queue
   * @param {int} index
   */
  EventQueue.prototype._remove = function _remove(index) {
    this._events.splice(index, 1);
    this._eventTimes.splice(index, 1);
  };

  /**
   * @class Abstract scheduler
   */
  function Scheduler() {
    this._queue = new EventQueue();
    this._repeat = [];
    this._current = null;
  }

  /**
   * @see ROT.EventQueue#getTime
   */
  Scheduler.prototype.getTime = function getTime() {
    return this._queue.getTime();
  };

  /**
   * @param {?} item
   * @param {bool} repeat
   */
  Scheduler.prototype.add = function add(item, repeat) {
    if (repeat) { this._repeat.push(item); }
    return this;
  };

  /**
   * Get the time the given item is scheduled for
   * @param {?} item
   * @returns {number} time
   */
  Scheduler.prototype.getTimeOf = function getTimeOf(item) {
    return this._queue.getEventTime(item);
  };

  /**
   * Clear all items
   */
  Scheduler.prototype.clear = function clear() {
    this._queue.clear();
    this._repeat = [];
    this._current = null;
    return this;
  };

  /**
   * Remove a previously added item
   * @param {?} item
   * @returns {bool} successful?
   */
  Scheduler.prototype.remove = function remove(item) {
    const result = this._queue.remove(item);

    const index = this._repeat.indexOf(item);
    if (index !== -1) { this._repeat.splice(index, 1); }

    if (this._current === item) { this._current = null; }

    return result;
  };

  /**
   * Schedule next item
   * @returns {?}
   */
  Scheduler.prototype.next = function next() {
    this._current = this._queue.get();
    return this._current;
  };

  /**
   * Sets prototype of this function to an instance of parent function
   * @param {function} parent
   */
  function extend(parent, child) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
    return this;
  }

  /**
   * @class Speed-based scheduler
   * @augments Scheduler
   */
  function SpeedScheduler() {
    Scheduler.call(this);
  }
  extend(Scheduler, SpeedScheduler);

  /**
   * @param {object} item anything with "getSpeed" method
   * @param {bool} repeat
   * @param {number} [time=1/item.getSpeed()]
   * @see Scheduler#add
   */
  SpeedScheduler.prototype.add = function add(item, repeat, time) {
    this._queue.add(item, time !== undefined ? time : 1 / item.getSpeed());
    return Scheduler.prototype.add.call(this, item, repeat);
  };

  /**
   * @see Scheduler#next
   */
  SpeedScheduler.prototype.next = function next() {
    if (this._current && this._repeat.indexOf(this._current) !== -1) {
      this._queue.add(this._current, 1 / this._current.getSpeed());
    }
    return Scheduler.prototype.next.call(this);
  };

  /**
   * @class Asynchronous main loop
   * @param {ROT.Scheduler} scheduler
   */
  function Engine(scheduler) {
    this._scheduler = scheduler;
    this._lock = 1;
  }

  /**
   * Start the main loop. When this call returns, the loop is locked.
   */
  Engine.prototype.start = function start() {
    return this.unlock();
  };

  /**
   * Interrupt the engine by an asynchronous action
   */
  Engine.prototype.lock = function lock() {
    this._lock++;
    return this;
  };

  /**
   * Resume execution (paused by a previous lock)
   */
  Engine.prototype.unlock = function unlock() {
    if (!this._lock) { throw new Error('Cannot unlock unlocked engine'); }
    this._lock--;

    while (!this._lock) {
      const actor = this._scheduler.next();
      if (!actor) { return this.lock(); } /* no actors */
      const result = actor.act();
      if (result && result.then) { /* actor returned a "thenable", looks like a Promise */
        this.lock();
        result.then(this.unlock.bind(this));
      }
    }

    return this;
  };

  function XY(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  XY.prototype.toString = function toString() {
    return `${this.x},${this.y}`;
  };

  XY.prototype.is = function is(xy) {
    return (this.x === xy.x && this.y === xy.y);
  };

  XY.prototype.dist8 = function dist8(xy) {
    var dx = xy.x - this.x;
    var dy = xy.y - this.y;
    return Math.max(Math.abs(dx), Math.abs(dy));
  };

  XY.prototype.dist4 = function dist4(xy) {
    var dx = xy.x - this.x;
    var dy = xy.y - this.y;
    return Math.abs(dx) + Math.abs(dy);
  };

  XY.prototype.dist = function dist(xy) {
    var dx = xy.x - this.x;
    var dy = xy.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  XY.prototype.plus = function plus(xy) {
    return new XY(this.x + xy.x, this.y + xy.y);
  };

  XY.prototype.minus = function minus(xy) {
    return new XY(this.x - xy.x, this.y - xy.y);
  };

  function TextBuffer() {
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

  const RE_COLORS = /%([bc]){([^}]*)}/g;

  /* token types */
  const TYPE_TEXT = 0;
  const TYPE_NEWLINE = 1;
  const TYPE_FG = 2;
  const TYPE_BG = 3;

  /**
  * Create new tokens and insert them into the stream
   * @param {object[]} tokens
   * @param {int} tokenIndex Token being processed
   * @param {int} breakIndex Index within current token's value
   * @param {bool} removeBreakChar Do we want to remove the breaking character?
   * @returns {string} remaining unbroken token value
   */
  function _breakInsideToken(tokens, tokenIndex, breakIndex, removeBreakChar) {
    const newBreakToken = {
      type: TYPE_NEWLINE
    };
    const newTextToken = {
      type: TYPE_TEXT,
      value: tokens[tokenIndex].value.substring(breakIndex + (removeBreakChar ? 1 : 0))
    };
    tokens.splice(tokenIndex + 1, 0, newBreakToken, newTextToken);
    return tokens[tokenIndex].value.substring(0, breakIndex);
  }

  /* insert line breaks into first-pass tokenized data */
  function _breakLines(tokens, maxWidth) {
    if (!maxWidth) { maxWidth = Infinity; }

    let i = 0;
    let lineLength = 0;
    let lastTokenWithSpace = -1;

    while (i < tokens.length) { /* take all text tokens, remove space, apply linebreaks */
      let token = tokens[i];
      if (token.type === TYPE_NEWLINE) { /* reset */
        lineLength = 0;
        lastTokenWithSpace = -1;
      }
      if (token.type !== TYPE_TEXT) { /* skip non-text tokens */
        i++;
      } else {
      /* remove spaces at the beginning of line */
        while (lineLength === 0 && token.value.charAt(0) === ' ') { token.value = token.value.substring(1); }

        /* forced newline? insert two new tokens after this one */
        let index = token.value.indexOf('\n');
        if (index !== -1) {
          token.value = _breakInsideToken(tokens, i, index, true);

          /* if there are spaces at the end, we must remove them (we do not want the line too long) */
          const arr = token.value.split('');
          while (arr.length && arr[arr.length - 1] === ' ') { arr.pop(); }
          token.value = arr.join('');
        }

        /* token degenerated? */
        if (!token.value.length) {
          tokens.splice(i, 1);
        } else if (lineLength + token.value.length > maxWidth) { /* line too long, find a suitable breaking spot */
        /* is it possible to break within this token? */
          index = -1;
          while (true) {
            const nextIndex = token.value.indexOf(' ', index + 1);
            if (nextIndex === -1) { break; }
            if (lineLength + nextIndex > maxWidth) { break; }
            index = nextIndex;
          }

          if (index !== -1) { /* break at space within this one */
            token.value = _breakInsideToken(tokens, i, index, true);
          } else if (lastTokenWithSpace !== -1) { /* is there a previous token where a break can occur? */
            token = tokens[lastTokenWithSpace];
            const breakIndex = token.value.lastIndexOf(' ');
            token.value = _breakInsideToken(tokens, lastTokenWithSpace, breakIndex, true);
            i = lastTokenWithSpace;
          } else { /* force break in this token */
            token.value = _breakInsideToken(tokens, i, maxWidth - lineLength, false);
          }
          i++; /* advance to next token */
        } else { /* line not long, continue */
          lineLength += token.value.length;
          if (token.value.indexOf(' ') !== -1) { lastTokenWithSpace = i; }
          i++; /* advance to next token */
        }
      }
    }


    tokens.push({ type: TYPE_NEWLINE }); /* insert fake newline to fix the last text line */

    /* remove trailing space from text tokens before newlines */
    let lastTextToken = null;
    for (i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      switch (token.type) {
      case TYPE_TEXT: lastTextToken = token; break;
      case TYPE_NEWLINE:
        if (lastTextToken) { /* remove trailing space */
          const arr = lastTextToken.value.split('');
          while (arr.length && arr[arr.length - 1] === ' ') { arr.pop(); }
          lastTextToken.value = arr.join('');
        }
        lastTextToken = null;
        break;
      default: break;
      }
    }

    tokens.pop(); /* remove fake token */

    return tokens;
  }

  /**
    * Convert string to a series of a formatting commands
    */
  function tokenize(str, maxWidth) {
    const result = [];

    /* first tokenization pass - split texts and color formatting commands */
    let offset = 0;
    str.replace(RE_COLORS, (match, type, name, index) => {
      /* string before */
      const part = str.substring(offset, index);
      if (part.length) {
        result.push({
          type: TYPE_TEXT,
          value: part
        });
      }

      /* color command */
      result.push({
        type: (type === 'c' ? TYPE_FG : TYPE_BG),
        value: name.trim()
      });

      offset = index + match.length;
      return '';
    });

    /* last remaining part */
    const part = str.substring(offset);
    if (part.length) {
      result.push({
        type: TYPE_TEXT,
        value: part
      });
    }

    return _breakLines(result, maxWidth);
  }

  /**
   * @class Abstract display backend module
   * @private
   */
  function DisplayBackend(context) {
    this._context = context;
  }

  DisplayBackend.prototype.compute = function compute(options) {}; // eslint-disable-line no-unused-vars

  DisplayBackend.prototype.draw = function draw(data, clearBefore) {}; // eslint-disable-line no-unused-vars

  DisplayBackend.prototype.computeSize = function computeSize(availWidth, availHeight) {}; // eslint-disable-line no-unused-vars

  DisplayBackend.prototype.computeFontSize = function computeFontSize(availWidth, availHeight) {}; // eslint-disable-line no-unused-vars

  DisplayBackend.prototype.eventToPosition = function eventToPosition(x, y) {}; // eslint-disable-line no-unused-vars

  /**
   * Always positive modulus
   * @param {int} n Modulus
   * @returns {int} this modulo n
   */
  function mod(n1, n2) {
    return ((n1 % n2) + n2) % n2;
  }

  /**
   * @class Hexagonal backend
   * @private
   */
  function HexDisplayBackend(context) {
    DisplayBackend.call(this, context);

    this._spacingX = 0;
    this._spacingY = 0;
    this._hexSize = 0;
    this._options = {};
  }
  extend(DisplayBackend, HexDisplayBackend);

  HexDisplayBackend.prototype.compute = function compute(options) {
    this._options = options;

    /* FIXME char size computation does not respect transposed hexes */
    const charWidth = Math.ceil(this._context.measureText('W').width);
    this._hexSize = Math.floor(options.spacing * (options.fontSize + charWidth / Math.sqrt(3)) / 2);
    this._spacingX = this._hexSize * Math.sqrt(3) / 2;
    this._spacingY = this._hexSize * 1.5;
    let xprop;
    let yprop;

    if (options.transpose) {
      xprop = 'height';
      yprop = 'width';
    } else {
      xprop = 'width';
      yprop = 'height';
    }
    this._context.canvas[xprop] = Math.ceil((options.width + 1) * this._spacingX);
    this._context.canvas[yprop] = Math.ceil((options.height - 1) * this._spacingY + 2 * this._hexSize);
  };

  HexDisplayBackend.prototype.draw = function draw(data, clearBefore) {
    const [x, y, ch, fg, bg] = data;

    const px = [
      (x + 1) * this._spacingX,
      y * this._spacingY + this._hexSize
    ];
    if (this._options.transpose) { px.reverse(); }

    if (clearBefore) {
      this._context.fillStyle = bg;
      this._fill(px[0], px[1]);
    }

    if (!ch) { return; }

    this._context.fillStyle = fg;

    const chars = [].concat(ch);
    for (let i = 0; i < chars.length; i++) {
      this._context.fillText(chars[i], px[0], Math.ceil(px[1]));
    }
  };

  HexDisplayBackend.prototype.computeSize = function computeSize(availWidth, availHeight) {
    if (this._options.transpose) {
      availWidth += availHeight;
      availHeight = availWidth - availHeight;
      availWidth -= availHeight;
    }

    const width = Math.floor(availWidth / this._spacingX) - 1;
    const height = Math.floor((availHeight - 2 * this._hexSize) / this._spacingY + 1);
    return [width, height];
  };

  HexDisplayBackend.prototype.computeFontSize = function computeFontSize(availWidth, availHeight) {
    if (this._options.transpose) {
      availWidth += availHeight;
      availHeight = availWidth - availHeight;
      availWidth -= availHeight;
    }

    const hexSizeWidth = 2 * availWidth / ((this._options.width + 1) * Math.sqrt(3)) - 1;
    const hexSizeHeight = availHeight / (2 + 1.5 * (this._options.height - 1));
    let hexSize = Math.min(hexSizeWidth, hexSizeHeight);

    /* compute char ratio */
    const oldFont = this._context.font;
    this._context.font = `100px ${this._options.fontFamily}`;
    const width = Math.ceil(this._context.measureText('W').width);
    this._context.font = oldFont;
    const ratio = width / 100;

    hexSize = Math.floor(hexSize) + 1; /* closest larger hexSize */

    /* FIXME char size computation does not respect transposed hexes */
    const fontSize = 2 * hexSize / (this._options.spacing * (1 + ratio / Math.sqrt(3)));

    /* closest smaller fontSize */
    return Math.ceil(fontSize) - 1;
  };

  HexDisplayBackend.prototype.eventToPosition = function eventToPosition(x, y) {
    let nodeSize;
    if (this._options.transpose) {
      x += y;
      y = x - y;
      x -= y;
      nodeSize = this._context.canvas.width;
    } else {
      nodeSize = this._context.canvas.height;
    }
    const size = nodeSize / this._options.height;
    y = Math.floor(y / size);

    if (mod(y, 2)) { /* odd row */
      x -= this._spacingX;
      x = 1 + 2 * Math.floor(x / (2 * this._spacingX));
    } else {
      x = 2 * Math.floor(x / (2 * this._spacingX));
    }

    return [x, y];
  };

  /**
   * Arguments are pixel values. If "transposed" mode is enabled, then these two are already swapped.
   */
  HexDisplayBackend.prototype._fill = function _fill(cx, cy) {
    const a = this._hexSize;
    const b = this._options.border;

    this._context.beginPath();

    if (this._options.transpose) {
      this._context.moveTo(cx - a + b, cy);
      this._context.lineTo(cx - a / 2 + b, cy + this._spacingX - b);
      this._context.lineTo(cx + a / 2 - b, cy + this._spacingX - b);
      this._context.lineTo(cx + a - b, cy);
      this._context.lineTo(cx + a / 2 - b, cy - this._spacingX + b);
      this._context.lineTo(cx - a / 2 + b, cy - this._spacingX + b);
      this._context.lineTo(cx - a + b, cy);
    } else {
      this._context.moveTo(cx, cy - a + b);
      this._context.lineTo(cx + this._spacingX - b, cy - a / 2 + b);
      this._context.lineTo(cx + this._spacingX - b, cy + a / 2 - b);
      this._context.lineTo(cx, cy + a - b);
      this._context.lineTo(cx - this._spacingX + b, cy + a / 2 - b);
      this._context.lineTo(cx - this._spacingX + b, cy - a / 2 + b);
      this._context.lineTo(cx, cy - a + b);
    }
    this._context.fill();
  };

  /**
   * @class Rectangular backend
   * @private
   */
  function RectDisplayBackend(context) {
    DisplayBackend.call(this, context);

    this._spacingX = 0;
    this._spacingY = 0;
    this._canvasCache = {};
    this._options = {};
  }
  extend(DisplayBackend, RectDisplayBackend);

  RectDisplayBackend.cache = false;

  RectDisplayBackend.prototype.compute = function compute(options) {
    this._canvasCache = {};
    this._options = options;

    const charWidth = Math.ceil(this._context.measureText('W').width);
    this._spacingX = Math.ceil(options.spacing * charWidth);
    this._spacingY = Math.ceil(options.spacing * options.fontSize);

    if (this._options.forceSquareRatio) {
      this._spacingX = this._spacingY = Math.max(this._spacingX, this._spacingY);
    }

    this._context.canvas.width = options.width * this._spacingX;
    this._context.canvas.height = options.height * this._spacingY;
  };

  RectDisplayBackend.prototype.draw = function draw(data, clearBefore) {
    if (this.constructor.cache) {
      this._drawWithCache(data, clearBefore);
    } else {
      this._drawNoCache(data, clearBefore);
    }
  };

  RectDisplayBackend.prototype._drawWithCache = function _drawWithCache(data) {
    const [x, y, ch, fg, bg] = data;

    const hash = `${ch}${fg}${bg}`;
    let canvas;
    if (this._canvasCache.hasOwnProperty(hash)) {
      canvas = this._canvasCache[hash];
    } else {
      const b = this._options.border;
      canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = this._spacingX;
      canvas.height = this._spacingY;
      ctx.fillStyle = bg;
      ctx.fillRect(b, b, canvas.width - b, canvas.height - b);

      if (ch) {
        ctx.fillStyle = fg;
        ctx.font = this._context.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const chars = [].concat(ch);
        for (let i = 0; i < chars.length; i++) {
          ctx.fillText(chars[i], this._spacingX / 2, Math.ceil(this._spacingY / 2));
        }
      }
      this._canvasCache[hash] = canvas;
    }

    this._context.drawImage(canvas, x * this._spacingX, y * this._spacingY);
  };

  RectDisplayBackend.prototype._drawNoCache = function _drawNoCache(data, clearBefore) {
    const [x, y, ch, fg, bg] = data;

    if (clearBefore) {
      const b = this._options.border;
      this._context.fillStyle = bg;
      this._context.fillRect(x * this._spacingX + b, y * this._spacingY + b, this._spacingX - b, this._spacingY - b);
    }

    if (!ch) { return; }

    this._context.fillStyle = fg;

    const chars = [].concat(ch);
    for (let i = 0; i < chars.length; i++) {
      this._context.fillText(chars[i], (x + 0.5) * this._spacingX, Math.ceil((y + 0.5) * this._spacingY));
    }
  };

  RectDisplayBackend.prototype.computeSize = function computeSize(availWidth, availHeight) {
    const width = Math.floor(availWidth / this._spacingX);
    const height = Math.floor(availHeight / this._spacingY);
    return [width, height];
  };

  RectDisplayBackend.prototype.computeFontSize = function computeFontSize(availWidth, availHeight) {
    const boxWidth = Math.floor(availWidth / this._options.width);
    let boxHeight = Math.floor(availHeight / this._options.height);

    /* compute char ratio */
    const oldFont = this._context.font;
    this._context.font = `100px ${this._options.fontFamily}`;
    const width = Math.ceil(this._context.measureText('W').width);
    this._context.font = oldFont;
    const ratio = width / 100;

    const widthFraction = ratio * boxHeight / boxWidth;
    if (widthFraction > 1) { /* too wide with current aspect ratio */
      boxHeight = Math.floor(boxHeight / widthFraction);
    }
    return Math.floor(boxHeight / this._options.spacing);
  };

  RectDisplayBackend.prototype.eventToPosition = function eventToPosition(x, y) {
    return [Math.floor(x / this._spacingX), Math.floor(y / this._spacingY)];
  };

  /**
   * @class Tile backend
   * @private
   */
  function TileDisplayBackend(context) {
    RectDisplayBackend.call(this, context);

    this._options = {};
    this._colorCanvas = document.createElement('canvas');
  }
  extend(RectDisplayBackend, TileDisplayBackend);

  TileDisplayBackend.prototype.compute = function compute(options) {
    this._options = options;
    this._context.canvas.width = options.width * options.tileWidth;
    this._context.canvas.height = options.height * options.tileHeight;
    this._colorCanvas.width = options.tileWidth;
    this._colorCanvas.height = options.tileHeight;
  };

  TileDisplayBackend.prototype.draw = function draw(data, clearBefore) {
    const [x, y, ch, fg, bg] = data;

    const { tileWidth, tileHeight } = this._options;

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

        const fg = fgs[i];
        const bg = bgs[i];

        context.drawImage(
          this._options.tileSet,
          tile[0], tile[1], tileWidth, tileHeight,
          0, 0, tileWidth, tileHeight,
        );

        if (fg !== 'transparent') {
          context.fillStyle = fg;
          context.globalCompositeOperation = 'source-atop';
          context.fillRect(0, 0, tileWidth, tileHeight);
        }

        if (bg !== 'transparent') {
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

  TileDisplayBackend.prototype.computeSize = function computeSize(availWidth, availHeight) {
    const width = Math.floor(availWidth / this._options.tileWidth);
    const height = Math.floor(availHeight / this._options.tileHeight);
    return [width, height];
  };

  TileDisplayBackend.prototype.computeFontSize = function computeFontSize(availWidth, availHeight) {
    const width = Math.floor(availWidth / this._options.width);
    const height = Math.floor(availHeight / this._options.height);
    return [width, height];
  };

  TileDisplayBackend.prototype.eventToPosition = function eventToPosition(x, y) {
    return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
  };

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
  function Display(options) {
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
      termColor: 'xterm'
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

  function Entity(visual) {
    this._visual = visual;
    this._xy = null;
    this._level = null;
  }

  Entity.prototype.getVisual = function getVisual() {
    return this._visual;
  };

  Entity.prototype.getXY = function getXY() {
    return this._xy;
  };

  Entity.prototype.getLevel = function getLevel() {
    return this._level;
  };

  Entity.prototype.setPosition = function setPosition(xy, level) {
    this._xy = xy;
    this._level = level;
    return this;
  };

  function Being(visual) {
    Entity.call(this, visual);

    this._speed = 100;
    this._hp = 10;
  }
  extend(Entity, Being);

  /**
   * Called by the Scheduler
   */
  Being.prototype.getSpeed = function getSpeed() {
    return this._speed;
  };

  Being.prototype.damage = function damage(damage) {
    this._hp -= damage;
    if (this._hp <= 0) { this.die(); }
  };

  Being.prototype.act = function act() {
    /* FIXME */
  };

  Being.prototype.die = function die() {
    Game.scheduler.remove(this);
  };

  Being.prototype.setPosition = function setPosition(xy, level) {
    /* came to a currently active level; add self to the scheduler */
    if (level !== this._level && level === Game.level) {
      Game.scheduler.add(this, true);
    }

    return Entity.prototype.setPosition.call(this, xy, level);
  };

  /**
    * @returns {bool} Is rot.js supported?
    */

  /** Directional constants. Ordering is important! */
  const DIRS = {
    4: [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ],
    8: [
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1]
    ],
    6: [
      [-1, -1],
      [1, -1],
      [2, 0],
      [1, 1],
      [-1, 1],
      [-2, 0]
    ]
  };
    /** Cancel key. */
  const KEYS = {
    CANCEL: 3,
    /** Help key. */
    HELP: 6,
    /** Backspace key. */
    BACK_SPACE: 8,
    /** Tab key. */
    TAB: 9,
    /** 5 key on Numpad when NumLock is unlocked. Or on Mac, clear key which is positioned at NumLock key. */
    CLEAR: 12,
    /** Return/enter key on the main keyboard. */
    RETURN: 13,
    /** Reserved, but not used. */
    ENTER: 14,
    /** Shift key. */
    SHIFT: 16,
    /** Control key. */
    CONTROL: 17,
    /** Alt (Option on Mac) key. */
    ALT: 18,
    /** Pause key. */
    PAUSE: 19,
    /** Caps lock. */
    CAPS_LOCK: 20,
    /** Escape key. */
    ESCAPE: 27,
    /** Space bar. */
    SPACE: 32,
    /** Page Up key. */
    PAGE_UP: 33,
    /** Page Down key. */
    PAGE_DOWN: 34,
    /** End key. */
    END: 35,
    /** Home key. */
    HOME: 36,
    /** Left arrow. */
    LEFT: 37,
    /** Up arrow. */
    UP: 38,
    /** Right arrow. */
    RIGHT: 39,
    /** Down arrow. */
    DOWN: 40,
    /** Print Screen key. */
    PRINTSCREEN: 44,
    /** Ins(ert) key. */
    INSERT: 45,
    /** Del(ete) key. */
    DELETE: 46,
    /** */
    0: 48,
    /** */
    1: 49,
    /** */
    2: 50,
    /** */
    3: 51,
    /** */
    4: 52,
    /** */
    5: 53,
    /** */
    6: 54,
    /** */
    7: 55,
    /** */
    8: 56,
    /** */
    9: 57,
    /** Colon (:) key. Requires Gecko 15.0 */
    COLON: 58,
    /** Semicolon (;) key. */
    SEMICOLON: 59,
    /** Less-than (<) key. Requires Gecko 15.0 */
    LESS_THAN: 60,
    /** Equals (=) key. */
    EQUALS: 61,
    /** Greater-than (>) key. Requires Gecko 15.0 */
    GREATER_THAN: 62,
    /** Question mark (?) key. Requires Gecko 15.0 */
    QUESTION_MARK: 63,
    /** Atmark (@) key. Requires Gecko 15.0 */
    AT: 64,
    /** */
    A: 65,
    /** */
    B: 66,
    /** */
    C: 67,
    /** */
    D: 68,
    /** */
    E: 69,
    /** */
    F: 70,
    /** */
    G: 71,
    /** */
    H: 72,
    /** */
    I: 73,
    /** */
    J: 74,
    /** */
    K: 75,
    /** */
    L: 76,
    /** */
    M: 77,
    /** */
    N: 78,
    /** */
    O: 79,
    /** */
    P: 80,
    /** */
    Q: 81,
    /** */
    R: 82,
    /** */
    S: 83,
    /** */
    T: 84,
    /** */
    U: 85,
    /** */
    V: 86,
    /** */
    W: 87,
    /** */
    X: 88,
    /** */
    Y: 89,
    /** */
    Z: 90,
    /** */
    CONTEXT_MENU: 93,
    /** 0 on the numeric keypad. */
    NUMPAD0: 96,
    /** 1 on the numeric keypad. */
    NUMPAD1: 97,
    /** 2 on the numeric keypad. */
    NUMPAD2: 98,
    /** 3 on the numeric keypad. */
    NUMPAD3: 99,
    /** 4 on the numeric keypad. */
    NUMPAD4: 100,
    /** 5 on the numeric keypad. */
    NUMPAD5: 101,
    /** 6 on the numeric keypad. */
    NUMPAD6: 102,
    /** 7 on the numeric keypad. */
    NUMPAD7: 103,
    /** 8 on the numeric keypad. */
    NUMPAD8: 104,
    /** 9 on the numeric keypad. */
    NUMPAD9: 105,
    /** * on the numeric keypad. */
    MULTIPLY: 106,
    /** + on the numeric keypad. */
    ADD: 107,
    /** */
    SEPARATOR: 108,
    /** - on the numeric keypad. */
    SUBTRACT: 109,
    /** Decimal point on the numeric keypad. */
    DECIMAL: 110,
    /** / on the numeric keypad. */
    DIVIDE: 111,
    /** F1 key. */
    F1: 112,
    /** F2 key. */
    F2: 113,
    /** F3 key. */
    F3: 114,
    /** F4 key. */
    F4: 115,
    /** F5 key. */
    F5: 116,
    /** F6 key. */
    F6: 117,
    /** F7 key. */
    F7: 118,
    /** F8 key. */
    F8: 119,
    /** F9 key. */
    F9: 120,
    /** F10 key. */
    F10: 121,
    /** F11 key. */
    F11: 122,
    /** F12 key. */
    F12: 123,
    /** F13 key. */
    F13: 124,
    /** F14 key. */
    F14: 125,
    /** F15 key. */
    F15: 126,
    /** F16 key. */
    F16: 127,
    /** F17 key. */
    F17: 128,
    /** F18 key. */
    F18: 129,
    /** F19 key. */
    F19: 130,
    /** F20 key. */
    F20: 131,
    /** F21 key. */
    F21: 132,
    /** F22 key. */
    F22: 133,
    /** F23 key. */
    F23: 134,
    /** F24 key. */
    F24: 135,
    /** Num Lock key. */
    NUM_LOCK: 144,
    /** Scroll Lock key. */
    SCROLL_LOCK: 145,
    /** Circumflex (^) key. Requires Gecko 15.0 */
    CIRCUMFLEX: 160,
    /** Exclamation (!) key. Requires Gecko 15.0 */
    EXCLAMATION: 161,
    /** Double quote () key. Requires Gecko 15.0 */
    DOUBLE_QUOTE: 162,
    /** Hash (#) key. Requires Gecko 15.0 */
    HASH: 163,
    /** Dollar sign ($) key. Requires Gecko 15.0 */
    DOLLAR: 164,
    /** Percent (%) key. Requires Gecko 15.0 */
    PERCENT: 165,
    /** Ampersand (&) key. Requires Gecko 15.0 */
    AMPERSAND: 166,
    /** Underscore (_) key. Requires Gecko 15.0 */
    UNDERSCORE: 167,
    /** Open parenthesis (() key. Requires Gecko 15.0 */
    OPEN_PAREN: 168,
    /** Close parenthesis ()) key. Requires Gecko 15.0 */
    CLOSE_PAREN: 169,
    /* Asterisk (*) key. Requires Gecko 15.0 */
    ASTERISK: 170,
    /** Plus (+) key. Requires Gecko 15.0 */
    PLUS: 171,
    /** Pipe (|) key. Requires Gecko 15.0 */
    PIPE: 172,
    /** Hyphen-US/docs/Minus (-) key. Requires Gecko 15.0 */
    HYPHEN_MINUS: 173,
    /** Open curly bracket ({) key. Requires Gecko 15.0 */
    OPEN_CURLY_BRACKET: 174,
    /** Close curly bracket (}) key. Requires Gecko 15.0 */
    CLOSE_CURLY_BRACKET: 175,
    /** Tilde (~) key. Requires Gecko 15.0 */
    TILDE: 176,
    /** Comma (,) key. */
    COMMA: 188,
    /** Period (.) key. */
    PERIOD: 190,
    /** Slash (/) key. */
    SLASH: 191,
    /** Back tick (`) key. */
    BACK_QUOTE: 192,
    /** Open square bracket ([) key. */
    OPEN_BRACKET: 219,
    /** Back slash (\) key. */
    BACK_SLASH: 220,
    /** Close square bracket (]) key. */
    CLOSE_BRACKET: 221,
    /** Quote (''') key. */
    QUOTE: 222,
    /** Meta key on Linux, Command key on Mac. */
    META: 224,
    /** AltGr key on Linux. Requires Gecko 15.0 */
    ALTGR: 225,
    /** Windows logo key on Windows. Or Super or Hyper key on Linux. Requires Gecko 15.0 */
    WIN: 91,
    /** Linux support for this keycode was added in Gecko 4.0. */
    KANA: 21,
    /** Linux support for this keycode was added in Gecko 4.0. */
    HANGUL: 21,
    /** 英数 key on Japanese Mac keyboard. Requires Gecko 15.0 */
    EISU: 22,
    /** Linux support for this keycode was added in Gecko 4.0. */
    JUNJA: 23,
    /** Linux support for this keycode was added in Gecko 4.0. */
    FINAL: 24,
    /** Linux support for this keycode was added in Gecko 4.0. */
    HANJA: 25,
    /** Linux support for this keycode was added in Gecko 4.0. */
    KANJI: 25,
    /** Linux support for this keycode was added in Gecko 4.0. */
    CONVERT: 28,
    /** Linux support for this keycode was added in Gecko 4.0. */
    NONCONVERT: 29,
    /** Linux support for this keycode was added in Gecko 4.0. */
    ACCEPT: 30,
    /** Linux support for this keycode was added in Gecko 4.0. */
    MODECHANGE: 31,
    /** Linux support for this keycode was added in Gecko 4.0. */
    SELECT: 41,
    /** Linux support for this keycode was added in Gecko 4.0. */
    PRINT: 42,
    /** Linux support for this keycode was added in Gecko 4.0. */
    EXECUTE: 43,
    /** Linux support for this keycode was added in Gecko 4.0. */
    SLEEP: 95
  };

  function Player() {
    Being.call(this, { ch: '@', fg: '#fff' });

    this._keys = {};
    this._keys[KEYS.K] = 0;
    this._keys[KEYS.UP] = 0;
    this._keys[KEYS.NUMPAD8] = 0;
    this._keys[KEYS.U] = 1;
    this._keys[KEYS.NUMPAD9] = 1;
    this._keys[KEYS.L] = 2;
    this._keys[KEYS.RIGHT] = 2;
    this._keys[KEYS.NUMPAD6] = 2;
    this._keys[KEYS.N] = 3;
    this._keys[KEYS.NUMPAD3] = 3;
    this._keys[KEYS.J] = 4;
    this._keys[KEYS.DOWN] = 4;
    this._keys[KEYS.NUMPAD2] = 4;
    this._keys[KEYS.B] = 5;
    this._keys[KEYS.NUMPAD1] = 5;
    this._keys[KEYS.H] = 6;
    this._keys[KEYS.LEFT] = 6;
    this._keys[KEYS.NUMPAD4] = 6;
    this._keys[KEYS.Y] = 7;
    this._keys[KEYS.NUMPAD7] = 7;

    this._keys[KEYS.PERIOD] = -1;
    this._keys[KEYS.CLEAR] = -1;
    this._keys[KEYS.NUMPAD5] = -1;
  }
  extend(Being, Player);

  Player.prototype.act = function act() {
    Game.textBuffer.write('It is your turn, press any relevant key.');
    Game.textBuffer.flush();
    Game.engine.lock();
    window.addEventListener('keydown', this);
  };

  Player.prototype.die = function die() {
    Being.prototype.die.call(this);
    Game.over();
  };

  Player.prototype.handleEvent = function handleEvent(e) {
    const keyHandled = this._handleKey(e.keyCode);

    if (keyHandled) {
      window.removeEventListener('keydown', this);
      Game.engine.unlock();
    }
  };

  Player.prototype._handleKey = function _handleKey(code) {
    if (this._keys.hasOwnProperty(code)) {
      Game.textBuffer.clear();

      const direction = this._keys[code];
      if (direction === -1) { /* noop */
        /* FIXME show something? */
        return true;
      }

      const dir = DIRS[8][direction];
      const xy = this._xy.plus(new XY(dir[0], dir[1]));

      this._level.setEntity(this, xy); /* FIXME collision detection */
      return true;
    }


    return false; /* unknown key */
  };

  function Level() {
    /* FIXME data structure for storing entities */
    this._beings = {};

    /* FIXME map data */
    this._size = new XY(80, 25);
    this._map = {};

    this._empty = new Entity({ ch: '.', fg: '#888', bg: null });
  }

  Level.prototype.getSize = function getSize() {
    return this._size;
  };

  Level.prototype.setEntity = function setEntity(entity, xy) {
    /* FIXME remove from old position, draw */
    if (entity.getLevel() === this) {
      const oldXY = entity.getXY();
      delete this._beings[oldXY];
      if (Game.level === this) { Game.draw(oldXY); }
    }

    entity.setPosition(xy, this); /* propagate position data to the entity itself */

    /* FIXME set new position, draw */
    this._beings[xy] = entity;
    if (Game.level === this) {
      Game.draw(xy);
      Game.textBuffer.write(`An entity moves to ${xy}.`);
    }
  };

  Level.prototype.getEntityAt = function getEntityAt(xy) {
    return this._beings[xy] || this._map[xy] || this._empty;
  };

  Level.prototype.getBeings = function getBeings() {
    /* FIXME list of all beings */
    return this._beings;
  };

  var Game = {
    scheduler: null,
    engine: null,
    player: null,
    level: null,
    display: null,
    textBuffer: null,

    init() {
      window.addEventListener('load', this);
    },

    handleEvent(e) {
      switch (e.type) {
      case 'load': {
        window.removeEventListener('load', this);

        this.scheduler = new SpeedScheduler();
        this.engine = new Engine(this.scheduler);
        this.display = new Display({ fontSize: 16 });
        this.textBuffer = new TextBuffer(this.display);
        document.body.appendChild(this.display.getContainer());
        this.player = new Player();

        /* FIXME build a level and position a player */
        const level = new Level();
        const size = level.getSize();
        this._switchLevel(level);
        this.level.setEntity(this.player, new XY(Math.round(size.x / 2), Math.round(size.y / 2)));

        this.engine.start();
        break;
      }
      default: break;
      }
    },

    draw(xy) {
      var entity = this.level.getEntityAt(xy);
      var visual = entity.getVisual();
      this.display.draw(xy.x, xy.y, visual.ch, visual.fg, visual.bg);
    },

    over() {
      this.engine.lock();
      /* FIXME show something */
    },

    _switchLevel(level) {
      /* remove old beings from the scheduler */
      this.scheduler.clear();

      this.level = level;
      const size = this.level.getSize();

      const bufferSize = 3;
      this.display.setOptions({ width: size.x, height: size.y + bufferSize });
      this.textBuffer.configure({
        display: this.display,
        position: new XY(0, size.y),
        size: new XY(size.x, bufferSize)
      });
      this.textBuffer.clear();

      /* FIXME draw a level */
      const xy = new XY();
      for (let i = 0; i < size.x; i++) {
        xy.x = i;
        for (let j = 0; j < size.y; j++) {
          xy.y = j;
          this.draw(xy);
        }
      }

      /* add new beings to the scheduler */
      const beings = this.level.getBeings();
      for (const p in beings) {
        if (beings.hasOwnProperty(p)) this.scheduler.add(beings[p], true);
      }
    }
  };

  Game.init();

}());
