import Game from './game';
import XY from './xy';
import Entity from './entity';

export default function Level() {
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
