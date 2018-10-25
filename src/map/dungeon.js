import Map from './map';
import { extend } from '../js/function';

/**
 * @class Dungeon map: has rooms and corridors
 * @augments Map
 */
export default function Dungeon(width, height) {
  Map.call(this, width, height);
  this._rooms = []; /* list of all rooms */
  this._corridors = [];
}
extend(Map, Dungeon);

/**
 * Get all generated rooms
 * @returns {Map.Feature.Room[]}
 */
Dungeon.prototype.getRooms = function getRooms() {
  return this._rooms;
};

/**
 * Get all generated corridors
 * @returns {Map.Feature.Corridor[]}
 */
Dungeon.prototype.getCorridors = function getCorridors() {
  return this._corridors;
};
