import Scheduler from './scheduler';
import { extend } from '../js/function';

/**
 * @class Action-based scheduler
 * @augments Scheduler
 */
export default function ActionScheduler() {
  Scheduler.call(this);
  this._defaultDuration = 1; /* for newly added */
  this._duration = this._defaultDuration; /* for this._current */
}
extend(Scheduler, ActionScheduler);

/**
 * @param {object} item
 * @param {bool} repeat
 * @param {number} [time=1]
 * @see Scheduler#add
 */
ActionScheduler.prototype.add = function add(item, repeat, time) {
  this._queue.add(item, time || this._defaultDuration);
  return Scheduler.prototype.add.call(this, item, repeat);
};

ActionScheduler.prototype.clear = function clear() {
  this._duration = this._defaultDuration;
  return Scheduler.prototype.clear.call(this);
};

ActionScheduler.prototype.remove = function remove(item) {
  if (item === this._current) { this._duration = this._defaultDuration; }
  return Scheduler.prototype.remove.call(this, item);
};

/**
 * @see Scheduler#next
 */
ActionScheduler.prototype.next = function next() {
  if (this._current && this._repeat.indexOf(this._current) !== -1) {
    this._queue.add(this._current, this._duration || this._defaultDuration);
    this._duration = this._defaultDuration;
  }
  return Scheduler.prototype.next.call(this);
};

/**
 * Set duration for the active item
 */
ActionScheduler.prototype.setDuration = function setDuration(time) {
  if (this._current) { this._duration = time; }
  return this;
};
