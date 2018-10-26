import Entity from './entity';
import Game from './game';
import extend from '../src/js/function';

export default function Being(visual) {
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
