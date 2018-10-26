export default function XY(x, y) {
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
