import FOV from './fov';
import extend from '../js/function';

/**
 * @class Recursive shadowcasting algorithm
 * Currently only supports 4/8 topologies, not hexagonal.
 * Based on Peter Harkins' implementation of Björn Bergström's algorithm described here: http://www.roguebasin.com/index.php?title=FOV_using_recursive_shadowcasting
 * @augments FOV
 */
export default function RecursiveShadowcasting(lightPassesCallback, options) {
  FOV.call(this, lightPassesCallback, options);
}
extend(FOV, RecursiveShadowcasting);

/** Octants used for translating recursive shadowcasting offsets */
RecursiveShadowcasting.OCTANTS = [
  [-1, 0, 0, 1],
  [0, -1, 1, 0],
  [0, -1, -1, 0],
  [-1, 0, 0, -1],
  [1, 0, 0, -1],
  [0, 1, -1, 0],
  [0, 1, 1, 0],
  [1, 0, 0, 1]
];

/**
 * Compute visibility for a 360-degree circle
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {function} callback
 */
RecursiveShadowcasting.prototype.compute = function compute(x, y, R, callback) {
  // You can always see your own tile
  callback(x, y, 0, 1);
  for (let i = 0; i < RecursiveShadowcasting.OCTANTS.length; i++) {
    this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[i], R, callback);
  }
};

/**
 * Compute visibility for a 180-degree arc
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {int} dir Direction to look in (expressed in a DIRS value);
 * @param {function} callback
 */
RecursiveShadowcasting.prototype.compute180 = function compute180(x, y, R, dir, callback) {
  // You can always see your own tile
  callback(x, y, 0, 1);
  const previousOctant = (dir - 1 + 8) % 8; // Need to retrieve the previous octant to render a full 180 degrees
  const nextPreviousOctant = (dir - 2 + 8) % 8; // Need to retrieve the previous two octants to render a full 180 degrees
  const nextOctant = (dir + 1 + 8) % 8; // Need to grab to next octant to render a full 180 degrees
  this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[nextPreviousOctant], R, callback);
  this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[previousOctant], R, callback);
  this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[dir], R, callback);
  this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[nextOctant], R, callback);
};

/**
 * Compute visibility for a 90-degree arc
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {int} dir Direction to look in (expressed in a DIRS value);
 * @param {function} callback
 */
RecursiveShadowcasting.prototype.compute90 = function compute90(x, y, R, dir, callback) {
  // You can always see your own tile
  callback(x, y, 0, 1);
  const previousOctant = (dir - 1 + 8) % 8; // Need to retrieve the previous octant to render a full 90 degrees
  this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[dir], R, callback);
  this._renderOctant(x, y, RecursiveShadowcasting.OCTANTS[previousOctant], R, callback);
};

/**
 * Render one octant (45-degree arc) of the viewshed
 * @param {int} x
 * @param {int} y
 * @param {int} octant Octant to be rendered
 * @param {int} R Maximum visibility radius
 * @param {function} callback
 */
RecursiveShadowcasting.prototype._renderOctant = function _renderOctant(x, y, octant, R, callback) {
  // Radius incremented by 1 to provide same coverage area as other shadowcasting radiuses
  this._castVisibility(x, y, 1, 1.0, 0.0, R + 1, octant[0], octant[1], octant[2], octant[3], callback);
};

/**
 * Actually calculates the visibility
 * @param {int} startX The starting X coordinate
 * @param {int} startY The starting Y coordinate
 * @param {int} row The row to render
 * @param {float} visSlopeStart The slope to start at
 * @param {float} visSlopeEnd The slope to end at
 * @param {int} radius The radius to reach out to
 * @param {int} xx
 * @param {int} xy
 * @param {int} yx
 * @param {int} yy
 * @param {function} callback The callback to use when we hit a block that is visible
 */
RecursiveShadowcasting.prototype._castVisibility = function _castVisibility(startX, startY, row, visSlopeStart, visSlopeEnd, radius, xx, xy, yx, yy, callback) {
  if (visSlopeStart < visSlopeEnd) { return; }
  for (let i = row; i <= radius; i++) {
    let dx = -i - 1;
    const dy = -i;
    let blocked = false;
    let newStart = 0;

    // 'Row' could be column, names here assume octant 0 and would be flipped for half the octants
    while (dx <= 0) {
      dx += 1;

      // Translate from relative coordinates to map coordinates
      const mapX = startX + dx * xx + dy * xy;
      const mapY = startY + dx * yx + dy * yy;

      // Range of the row
      const slopeStart = (dx - 0.5) / (dy + 0.5);
      const slopeEnd = (dx + 0.5) / (dy - 0.5);

      // Ignore if not yet at left edge of Octant
      if (slopeEnd <= visSlopeStart) {
      // Done if past right edge
        if (slopeStart < visSlopeEnd) { break; }

        // If it's in range, it's visible
        if ((dx * dx + dy * dy) < (radius * radius)) {
          callback(mapX, mapY, i, 1);
        }

        if (!blocked) {
        // If tile is a blocking tile, cast around it
          if (!this._lightPasses(mapX, mapY) && i < radius) {
            blocked = true;
            this._castVisibility(startX, startY, i + 1, visSlopeStart, slopeStart, radius, xx, xy, yx, yy, callback);
            newStart = slopeEnd;
          }
        } else if (!this._lightPasses(mapX, mapY)) {
          newStart = slopeEnd;
        } else {
        // Block has ended
          blocked = false;
          visSlopeStart = newStart;
        }
      }
    }
    if (blocked) { break; }
  }
};
