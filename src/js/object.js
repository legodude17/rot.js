if (!Object.create) {
  /**
	 * ES5 Object.create
	 */
  Object.create = function (o) {
    const tmp = function () {};
    tmp.prototype = o;
    return new tmp();
  };
}
