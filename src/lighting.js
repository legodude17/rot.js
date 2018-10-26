import { fromString, add_ } from './color';

/**
 * @class Lighting computation, based on a traditional FOV for multiple light sources and multiple passes.
 * @param {function} reflectivityCallback Callback to retrieve cell reflectivity (0..1)
 * @param {object} [options]
 * @param {int} [options.passes=1] Number of passes. 1 equals to simple FOV of all light sources, >1 means a *highly simplified* radiosity-like algorithm.
 * @param {int} [options.emissionThreshold=100] Cells with emissivity > threshold will be treated as light source in the next pass.
 * @param {int} [options.range=10] Max light range
 */
export default function Lighting(reflectivityCallback, options) {
  this._reflectivityCallback = reflectivityCallback;
  this._options = {
    passes: 1,
    emissionThreshold: 100,
    range: 10
  };
  this._fov = null;

  this._lights = {};
  this._reflectivityCache = {};
  this._fovCache = {};

  this.setOptions(options);
}

/**
 * Adjust options at runtime
 * @see Lighting
 * @param {object} [options]
 */
Lighting.prototype.setOptions = function setOptions(options) {
  for (const p in options) { if (options.hasOwnProperty(p)) this._options[p] = options[p]; }
  if (options && options.range) { this.reset(); }
  return this;
};

/**
 * Set the used Field-Of-View algo
 * @param {ROT.FOV} fov
 */
Lighting.prototype.setFOV = function setFOV(fov) {
  this._fov = fov;
  this._fovCache = {};
  return this;
};

/**
 * Set (or remove) a light source
 * @param {int} x
 * @param {int} y
 * @param {null || string || number[3]} color
 */
Lighting.prototype.setLight = function setLight(x, y, color) {
  const key = `${x},${y}`;

  if (color) {
    this._lights[key] = (typeof (color) === 'string' ? fromString(color) : color);
  } else {
    delete this._lights[key];
  }
  return this;
};

/**
 * Remove all light sources
 */
Lighting.prototype.clearLights = function clearLights() {
  this._lights = {};
};

/**
 * Reset the pre-computed topology values. Call whenever the underlying map changes its light-passability.
 */
Lighting.prototype.reset = function reset() {
  this._reflectivityCache = {};
  this._fovCache = {};

  return this;
};

/**
 * Compute the lighting
 * @param {function} lightingCallback Will be called with (x, y, color) for every lit cell
 */
Lighting.prototype.compute = function compute(lightingCallback) {
  const doneCells = {};
  let emittingCells = {};
  const litCells = {};

  for (const key in this._lights) { /* prepare emitters for first pass */
    if (this._lights.hasOwnProperty(key)) {
      const light = this._lights[key];
      emittingCells[key] = [0, 0, 0];
      add_(emittingCells[key], light);
    }
  }

  for (let i = 0; i < this._options.passes; i++) { /* main loop */
    this._emitLight(emittingCells, litCells, doneCells);
    if (i + 1 !== this._options.passes) {
      emittingCells = this._computeEmitters(litCells, doneCells);
    } /* not for the last pass */
  }

  for (const litKey in litCells) { /* let the user know what and how is lit */
    if (litCells.hasOwnProperty(litKey)) {
      const parts = litKey.split(',');
      const x = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      lightingCallback(x, y, litCells[litKey]);
    }
  }

  return this;
};

/**
 * Compute one iteration from all emitting cells
 * @param {object} emittingCells These emit light
 * @param {object} litCells Add projected light to these
 * @param {object} doneCells These already emitted, forbid them from further calculations
 */
Lighting.prototype._emitLight = function _emitLight(emittingCells, litCells, doneCells) {
  for (const key in emittingCells) {
    if (emittingCells.hasOwnProperty(key)) {
      const parts = key.split(',');
      const x = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      this._emitLightFromCell(x, y, emittingCells[key], litCells);
      doneCells[key] = 1;
    }
  }
  return this;
};

/**
 * Prepare a list of emitters for next pass
 * @param {object} litCells
 * @param {object} doneCells
 * @returns {object}
 */
Lighting.prototype._computeEmitters = function _computeEmitters(litCells, doneCells) {
  const result = {};

  for (const key in litCells) {
    if (!doneCells.hasOwnProperty(key)) {
      const color = litCells[key];
      let reflectivity;

      if (this._reflectivityCache.hasOwnProperty(key)) {
        reflectivity = this._reflectivityCache[key];
      } else {
        const parts = key.split(',');
        const x = parseInt(parts[0], 10);
        const y = parseInt(parts[1], 10);
        reflectivity = this._reflectivityCallback(x, y);
        this._reflectivityCache[key] = reflectivity;
      }

      if (reflectivity !== 0) {
      /* compute emission color */
        const emission = [];
        let intensity = 0;
        for (let i = 0; i < 3; i++) {
          const part = Math.round(color[i] * reflectivity);
          emission[i] = part;
          intensity += part;
        }
        if (intensity > this._options.emissionThreshold) { result[key] = emission; }
      }
    }
  }

  return result;
};

/**
 * Compute one iteration from one cell
 * @param {int} x
 * @param {int} y
 * @param {number[]} color
 * @param {object} litCells Cell data to by updated
 */
Lighting.prototype._emitLightFromCell = function _emitLightFromCell(x, y, color, litCells) {
  const key = `${x},${y}`;
  let fov;
  if (this._fovCache.hasOwnProperty(key)) {
    fov = this._fovCache[key];
  } else {
    fov = this._updateFOV(x, y);
  }

  for (const fovKey in fov) {
    if (fov.hasOwnProperty(fovKey)) {
      const formFactor = fov[fovKey];
      let result;

      if (litCells.hasOwnProperty(fovKey)) { /* already lit */
        result = litCells[fovKey];
      } else { /* newly lit */
        result = [0, 0, 0];
        litCells[fovKey] = result;
      }

      for (let i = 0; i < 3; i++) { result[i] += Math.round(color[i] * formFactor); } /* add light color */
    }
  }

  return this;
};

/**
 * Compute FOV ("form factor") for a potential light source at [x,y]
 * @param {int} x
 * @param {int} y
 * @returns {object}
 */
Lighting.prototype._updateFOV = function _updateFOV(x, y) {
  const key1 = `${x},${y}`;
  const cache = {};
  this._fovCache[key1] = cache;
  const { range } = this._options;
  const cb = function cb(x, y, r, vis) {
    const key2 = `${x},${y}`;
    const formFactor = vis * (1 - r / range);
    if (formFactor === 0) { return; }
    cache[key2] = formFactor;
  };
  this._fov.compute(x, y, range, cb.bind(this));

  return cache;
};
