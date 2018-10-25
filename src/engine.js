/**
 * @class Asynchronous main loop
 * @param {ROT.Scheduler} scheduler
 */
export default function Engine(scheduler) {
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
