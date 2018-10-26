import Being from './being';
import { KEYS, DIRS } from '../src/rot';
import extend from '../src/js/function';
import Game from './game';
import XY from './xy';

export default function Player() {
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
