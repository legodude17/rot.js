import Map from './map';
import extend from '../js/function';
import { randomizeArray } from '../js/array';
import { getUniform, getUniformInt } from '../rng';
import { DIRS } from '../rot';

/**
 * @author hyakugei
 * @class Dungeon generator which uses the "orginal" Rogue dungeon generation algorithm. See http://kuoi.com/~kamikaze/GameDesign/art07_rogue_dungeon.php
 * @augments Map
 * @param {int} [width]
 * @param {int} [height]
 * @param {object} [options] Options
 * @param {int[]} [options.cellWidth=3] Number of cells to create on the horizontal (number of rooms horizontally)
 * @param {int[]} [options.cellHeight=3] Number of cells to create on the vertical (number of rooms vertically)
 * @param {int} [options.roomWidth] Room min and max width - normally set auto-magically via the constructor.
 * @param {int} [options.roomHeight] Room min and max height - normally set auto-magically via the constructor.
 */
export default function RogueMap(width, height, options) {
  Map.call(this, width, height);

  this._options = {
    cellWidth: 3, // NOTE to self, these could probably work the same as the roomWidth/room Height values
    cellHeight: 3 //     ie. as an array with min-max values for each direction....
  };

  Object.assign(this._options, options);

  /*
  Set the room sizes according to the over-all width of the map,
  and the cell sizes.
  */
  if (!this._options.hasOwnProperty('roomWidth')) {
    this._options.roomWidth = this._calculateRoomSize(this._width, this._options.cellWidth);
  }
  if (!this._options.hasOwnProperty('roomHeight')) {
    this._options.roomHeight = this._calculateRoomSize(this._height, this._options.cellHeight);
  }
}

extend(Map, RogueMap);

/**
 * @see Map#create
 */
RogueMap.prototype.create = function create(callback) {
  this.map = this._fillMap(1);
  this.rooms = [];
  this.connectedCells = [];

  this._initRooms();
  this._connectRooms();
  this._connectUnconnectedRooms();
  this._createRandomRoomConnections();
  this._createRooms();
  this._createCorridors();

  if (callback) {
    for (let i = 0; i < this._width; i++) {
      for (let j = 0; j < this._height; j++) {
        callback(i, j, this.map[i][j]);
      }
    }
  }

  return this;
};

RogueMap.prototype._calculateRoomSize = function _calculateRoomSize(size, cell) {
  let max = Math.floor((size / cell) * 0.8);
  let min = Math.floor((size / cell) * 0.25);
  if (min < 2) { min = 2; }
  if (max < 2) { max = 2; }
  return [min, max];
};

RogueMap.prototype._initRooms = function _initRooms() {
  // create rooms array. This is the "grid" list from the algo.
  for (let i = 0; i < this._options.cellWidth; i++) {
    this.rooms.push([]);
    for (let j = 0; j < this._options.cellHeight; j++) {
      this.rooms[i].push({
        x: 0, y: 0, width: 0, height: 0, connections: [], cellx: i, celly: j
      });
    }
  }
};

RogueMap.prototype._connectRooms = function _connectRooms() {
  // pick random starting grid
  let cgx = getUniformInt(0, this._options.cellWidth - 1);
  let cgy = getUniformInt(0, this._options.cellHeight - 1);

  let idx;
  let ncgx;
  let ncgy;

  let found = false;
  let room;
  let otherRoom;

  // find  unconnected neighbour cells
  let dirToCheck;
  do {
    // var dirToCheck = [0, 1, 2, 3, 4, 5, 6, 7];
    dirToCheck = randomizeArray([0, 2, 4, 6]);

    do {
      found = false;
      idx = dirToCheck.pop();

      ncgx = cgx + DIRS[8][idx][0];
      ncgy = cgy + DIRS[8][idx][1];

      if (!((ncgx < 0 || ncgx >= this._options.cellWidth) || (ncgy < 0 || ncgy >= this._options.cellHeight))) {
        room = this.rooms[cgx][cgy];

        if (room.connections.length > 0) {
        // as long as this room doesn't already coonect to me, we are ok with it.
          if (room.connections[0][0] === ncgx && room.connections[0][1] === ncgy) {
            break;
          }
        }

        otherRoom = this.rooms[ncgx][ncgy];

        if (otherRoom.connections.length === 0) {
          otherRoom.connections.push([cgx, cgy]);

          this.connectedCells.push([ncgx, ncgy]);
          cgx = ncgx;
          cgy = ncgy;
          found = true;
        }
      }
    } while (dirToCheck.length > 0 && found === false);
  } while (dirToCheck.length > 0);
};

RogueMap.prototype._connectUnconnectedRooms = function _connectUnconnectedRooms() {
  // While there are unconnected rooms, try to connect them to a random connected neighbor
  // (if a room has no connected neighbors yet, just keep cycling, you'll fill out to it eventually).
  const cw = this._options.cellWidth;
  const ch = this._options.cellHeight;

  this.connectedCells = randomizeArray(this.connectedCells);
  let room;
  let otherRoom;
  let validRoom;

  for (let i = 0; i < this._options.cellWidth; i++) {
    for (let j = 0; j < this._options.cellHeight; j++) {
      room = this.rooms[i][j];

      if (room.connections.length === 0) {
        const directions = randomizeArray([0, 2, 4, 6]);

        validRoom = false;

        do {
          const dirIdx = directions.pop();
          const newI = i + DIRS[8][dirIdx][0];
          const newJ = j + DIRS[8][dirIdx][1];

          if (!(newI < 0 || newI >= cw || newJ < 0 || newJ >= ch)) {
            otherRoom = this.rooms[newI][newJ];

            validRoom = true;

            if (otherRoom.connections.length === 0) { break; }

            for (let k = 0; k < otherRoom.connections.length; k++) {
              if (otherRoom.connections[k][0] === i && otherRoom.connections[k][1] === j) {
                validRoom = false;
                break;
              }
            }

            if (validRoom) { break; }
          }
        } while (directions.length);

        if (validRoom) {
          room.connections.push([otherRoom.cellx, otherRoom.celly]);
        } else {
          console.log('-- Unable to connect room.'); // eslint-disable-line no-console
        }
      }
    }
  }
};

RogueMap.prototype._createRandomRoomConnections = function _createRandomRoomConnections(connections) { // eslint-disable-line no-unused-vars,max-len
  // Empty for now.
};


RogueMap.prototype._createRooms = function _createRooms() {
  // Create Rooms

  const w = this._width;
  const h = this._height;

  const cw = this._options.cellWidth;
  const ch = this._options.cellHeight;

  const cwp = Math.floor(this._width / cw);
  const chp = Math.floor(this._height / ch);

  let roomw;
  let roomh;
  const { roomWidth, roomHeight } = this._options;
  let sx;
  let sy;
  let otherRoom;

  for (let i = 0; i < cw; i++) {
    for (let j = 0; j < ch; j++) {
      sx = cwp * i;
      sy = chp * j;

      if (sx === 0) { sx = 1; }
      if (sy === 0) { sy = 1; }

      roomw = getUniformInt(roomWidth[0], roomWidth[1]);
      roomh = getUniformInt(roomHeight[0], roomHeight[1]);

      if (j > 0) {
        otherRoom = this.rooms[i][j - 1];
        while (sy - (otherRoom.y + otherRoom.height) < 3) {
          sy++;
        }
      }

      if (i > 0) {
        otherRoom = this.rooms[i - 1][j];
        while (sx - (otherRoom.x + otherRoom.width) < 3) {
          sx++;
        }
      }

      let sxOffset = Math.round(getUniformInt(0, cwp - roomw) / 2);
      let syOffset = Math.round(getUniformInt(0, chp - roomh) / 2);

      while (sx + sxOffset + roomw >= w) {
        if (sxOffset) {
          sxOffset--;
        } else {
          roomw--;
        }
      }

      while (sy + syOffset + roomh >= h) {
        if (syOffset) {
          syOffset--;
        } else {
          roomh--;
        }
      }

      sx += sxOffset;
      sy += syOffset;

      this.rooms[i][j].x = sx;
      this.rooms[i][j].y = sy;
      this.rooms[i][j].width = roomw;
      this.rooms[i][j].height = roomh;

      for (let ii = sx; ii < sx + roomw; ii++) {
        for (let jj = sy; jj < sy + roomh; jj++) {
          this.map[ii][jj] = 0;
        }
      }
    }
  }
};

RogueMap.prototype._getWallPosition = function _getWallPosition(aRoom, aDirection) {
  let rx;
  let ry;
  let door;

  if (aDirection === 1 || aDirection === 3) {
    rx = getUniformInt(aRoom.x + 1, aRoom.x + aRoom.width - 2);
    if (aDirection === 1) {
      ry = aRoom.y - 2;
      door = ry + 1;
    } else {
      ry = aRoom.y + aRoom.height + 1;
      door = ry - 1;
    }

    this.map[rx][door] = 0; // i'm not setting a specific 'door' tile value right now, just empty space.
  } else if (aDirection === 2 || aDirection === 4) {
    ry = getUniformInt(aRoom.y + 1, aRoom.y + aRoom.height - 2);
    if (aDirection === 2) {
      rx = aRoom.x + aRoom.width + 1;
      door = rx - 1;
    } else {
      rx = aRoom.x - 2;
      door = rx + 1;
    }

    this.map[door][ry] = 0; // i'm not setting a specific 'door' tile value right now, just empty space.
  }
  return [rx, ry];
};

/** *
* @param startPosition a 2 element array
* @param endPosition a 2 element array
*/
RogueMap.prototype._drawCorridor = function _drawCorridor(startPosition, endPosition) {
  const xOffset = endPosition[0] - startPosition[0];
  const yOffset = endPosition[1] - startPosition[1];

  let xpos = startPosition[0];
  let ypos = startPosition[1];

  let tempDist;
  const xDir = xOffset > 0 ? 2 : 6;
  const yDir = yOffset > 0 ? 4 : 0;

  let move; // 2 element array, element 0 is the direction, element 1 is the total value to move.
  const moves = []; // a list of 2 element arrays

  const xAbs = Math.abs(xOffset);
  const yAbs = Math.abs(yOffset);

  const percent = getUniform(); // used to split the move at different places along the long axis
  const firstHalf = percent;
  const secondHalf = 1 - percent;

  if (xAbs < yAbs) {
    // move firstHalf of the y offset
    tempDist = Math.ceil(yAbs * firstHalf);
    moves.push([yDir, tempDist]);
    // move all the x offset
    moves.push([xDir, xAbs]);
    // move sendHalf of the  y offset
    tempDist = Math.floor(yAbs * secondHalf);
    moves.push([yDir, tempDist]);
  } else {
    //  move firstHalf of the x offset
    tempDist = Math.ceil(xAbs * firstHalf);
    moves.push([xDir, tempDist]);
    // move all the y offset
    moves.push([yDir, yAbs]);
    // move secondHalf of the x offset.
    tempDist = Math.floor(xAbs * secondHalf);
    moves.push([xDir, tempDist]);
  }

  this.map[xpos][ypos] = 0;

  while (moves.length > 0) {
    move = moves.pop();
    while (move[1] > 0) {
      xpos += DIRS[8][move[0]][0];
      ypos += DIRS[8][move[0]][1];
      this.map[xpos][ypos] = 0;
      move[1] -= 1;
    }
  }
};

RogueMap.prototype._createCorridors = function _createCorridors() {
  // Draw Corridors between connected rooms

  const cw = this._options.cellWidth;
  const ch = this._options.cellHeight;
  let room;
  let connection;
  let otherRoom;
  let wall;
  let otherWall;

  for (let i = 0; i < cw; i++) {
    for (let j = 0; j < ch; j++) {
      room = this.rooms[i][j];

      for (let k = 0; k < room.connections.length; k++) {
        connection = room.connections[k];

        otherRoom = this.rooms[connection[0]][connection[1]];

        // figure out what wall our corridor will start one.
        // figure out what wall our corridor will end on.
        if (otherRoom.cellx > room.cellx) {
          wall = 2;
          otherWall = 4;
        } else if (otherRoom.cellx < room.cellx) {
          wall = 4;
          otherWall = 2;
        } else if (otherRoom.celly > room.celly) {
          wall = 3;
          otherWall = 1;
        } else if (otherRoom.celly < room.celly) {
          wall = 1;
          otherWall = 3;
        }

        this._drawCorridor(this._getWallPosition(room, wall), this._getWallPosition(otherRoom, otherWall));
      }
    }
  }
};
