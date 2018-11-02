let seed; let s0; let s1; let s2; let
  c;

const FRAC = 2.3283064365386963e-10;

/* eslint-disable no-bitwise */
/**
  * @returns {number}
  */
export function getSeed() {
  return seed;
}

/**
  * @param {number} seed Seed the number generator
  */
export function setSeed(sed) {
  sed = (sed < 1 ? 1 / sed : sed);

  seed = sed;
  s0 = (sed >>> 0) * FRAC;

  sed = (sed * 69069 + 1) >>> 0;
  s1 = sed * FRAC;

  sed = (sed * 69069 + 1) >>> 0;
  s2 = sed * FRAC;

  c = 1;
  return this;
}

/**
  * @returns {float} Pseudorandom value [0,1), uniformly distributed
  */
export function getUniform() {
  const t = 2091639 * s0 + c * FRAC;
  s0 = s1;
  s1 = s2;
  c = t | 0;
  s2 = t - c;
  return s2;
}

/**
  * @param {int} lowerBound The lower end of the range to return a value from, inclusive
  * @param {int} upperBound The upper end of the range to return a value from, inclusive
  * @returns {int} Pseudorandom value [lowerBound, upperBound], using getUniform() to distribute the value
  */
export function getUniformInt(lowerBound, upperBound) {
  const max = Math.max(lowerBound, upperBound);
  const min = Math.min(lowerBound, upperBound);
  return Math.floor(getUniform() * (max - min + 1)) + min;
}

/**
  * @param {float} [mean=0] Mean value
  * @param {float} [stddev=1] Standard deviation. ~95% of the absolute values will be lower than 2*stddev.
  * @returns {float} A normally distributed pseudorandom value
  */
export function getNormal(mean, stddev) {
  let u; let r;
  do {
    u = 2 * getUniform() - 1;
    const v = 2 * getUniform() - 1;
    r = u * u + v * v;
  } while (r > 1 || r === 0);

  const gauss = u * Math.sqrt(-2 * Math.log(r) / r);
  return (mean || 0) + gauss * (stddev || 1);
}

/**
  * @returns {int} Pseudorandom value [1,100] inclusive, uniformly distributed
  */
export function getPercentage() {
  return 1 + Math.floor(getUniform() * 100);
}

/**
  * @param {object} data key=whatever, value=weight (relative probability)
  * @returns {string} whatever
  */
export function getWeightedValue(data) {
  let total = 0;

  for (const id in data) {
    if (data.hasOwnProperty(id)) total += data[id];
  }
  const random = getUniform() * total;

  let part = 0;
  let id;
  for (id in data) {
    if (data.hasOwnProperty(id)) {
      part += data[id];
      if (random < part) { return id; }
    }
  }

  // If by some floating-point annoyance we have
  // random >= total, just return the last id.
  return id;
}

/**
  * Get RNG state. Useful for storing the state and re-setting it via setState.
  * @returns {?} Internal state
  */
export function getState() {
  return [s0, s1, s2, c];
}

/**
  * Set a previously retrieved state.
  * @param {?} state
  */
export function setState(state) {
  [s0, s1, s2, c] = state;
  return this;
}

/**
  * Returns a cloned RNG
  */
export function clone() {
  const clone = Object.create(this);
  clone.setState(getState());
  return clone;
}

setSeed(Date.now());
