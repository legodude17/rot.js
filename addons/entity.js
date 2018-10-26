export default function Entity(visual) {
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
