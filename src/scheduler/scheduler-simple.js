import Scheduler from './scheduler';
import extend from '../js/function';

/**
 * @class Simple fair scheduler (round-robin style)
 * @augments Scheduler
 */
export default function SimpleScheduler() {
  Scheduler.call(this);
}
extend(Scheduler, SimpleScheduler);

/**
 * @see Scheduler#add
 */
SimpleScheduler.prototype.add = function add(item, repeat) {
  this._queue.add(item, 0);
  return Scheduler.prototype.add.call(this, item, repeat);
};

/**
 * @see Scheduler#next
 */
SimpleScheduler.prototype.next = function next() {
  if (this._current && this._repeat.indexOf(this._current) !== -1) {
    this._queue.add(this._current, 0);
  }
  return Scheduler.prototype.next.call(this);
};
