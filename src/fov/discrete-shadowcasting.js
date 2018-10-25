import FOV from './fov';
import extend from '../js/function';

/**
 * @class Discrete shadowcasting algorithm. Obsoleted by Precise shadowcasting.
 * @augments FOV
 */
export default function DiscreteShadowcasting(lightPassesCallback, options) {
  FOV.call(this, lightPassesCallback, options);
}
extend(FOV, DiscreteShadowcasting);

/**
 * @see FOV#compute
 */
DiscreteShadowcasting.prototype.compute = function compute(x, y, R, callback) {
  /* this place is always visible */
  callback(x, y, 0, 1);

  /* standing in a dark place. FIXME is this a good idea?  */
  if (!this._lightPasses(x, y)) { return; }

  /* start and end angles */
  const DATA = [];

  let A; let B; let cx; let cy; let
    blocks;

  /* analyze surrounding cells in concentric rings, starting from the center */
  for (let r = 1; r <= R; r++) {
    const neighbors = this._getCircle(x, y, r);
    const angle = 360 / neighbors.length;

    for (let i = 0; i < neighbors.length; i++) {
      [cx, cy] = neighbors[i];
      A = angle * (i - 0.5);
      B = A + angle;

      blocks = !this._lightPasses(cx, cy);
      if (this._visibleCoords(Math.floor(A), Math.ceil(B), blocks, DATA)) { callback(cx, cy, r, 1); }

      if (DATA.length === 2 && DATA[0] === 0 && DATA[1] === 360) { return; } /* cutoff? */
    } /* for all cells in this ring */
  } /* for all rings */
};

/**
 * @param {int} A start angle
 * @param {int} B end angle
 * @param {bool} blocks Does current cell block visibility?
 * @param {int[][]} DATA shadowed angle pairs
 */
DiscreteShadowcasting.prototype._visibleCoords = function _visibleCoords(A, B, blocks, DATA) {
  if (A < 0) {
    const v1 = this._visibleCoords(0, B, blocks, DATA);
    const v2 = this._visibleCoords(360 + A, 360, blocks, DATA);
    return v1 || v2;
  }

  let index = 0;
  while (index < DATA.length && DATA[index] < A) { index++; }

  if (index === DATA.length) { /* completely new shadow */
    if (blocks) { DATA.push(A, B); }
    return true;
  }

  let count = 0;

  if (index % 2) { /* this shadow starts in an existing shadow, or within its ending boundary */
    while (index < DATA.length && DATA[index] < B) {
      index++;
      count++;
    }

    if (count === 0) { return false; }

    if (blocks) {
      if (count % 2) {
        DATA.splice(index - count, count, B);
      } else {
        DATA.splice(index - count, count);
      }
    }

    return true;
  } /* this shadow starts outside an existing shadow, or within a starting boundary */
  while (index < DATA.length && DATA[index] < B) {
    index++;
    count++;
  }

  /* visible when outside an existing shadow, or when overlapping */
  if (A === DATA[index - count] && count === 1) { return false; }

  if (blocks) {
    if (count % 2) {
      DATA.splice(index - count, count, A);
    } else {
      DATA.splice(index - count, count, A, B);
    }
  }

  return true;
};
