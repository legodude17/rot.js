import Scheduler from './scheduler';
import extend from '../js/function';

/**
 * @class Speed-based scheduler
 * @augments Scheduler
 */
export default function SpeedScheduler() {
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
