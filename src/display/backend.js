/**
 * @class Abstract display backend module
 * @private
 */
export default function DisplayBackend(context) {
  this._context = context;
}

DisplayBackend.prototype.compute = function compute(options) {}; // eslint-disable-line no-unused-vars

DisplayBackend.prototype.draw = function draw(data, clearBefore) {}; // eslint-disable-line no-unused-vars

DisplayBackend.prototype.computeSize = function computeSize(availWidth, availHeight) {}; // eslint-disable-line no-unused-vars

DisplayBackend.prototype.computeFontSize = function computeFontSize(availWidth, availHeight) {}; // eslint-disable-line no-unused-vars

DisplayBackend.prototype.eventToPosition = function eventToPosition(x, y) {}; // eslint-disable-line no-unused-vars
