/**
 * @class Random dungeon generator using human-like digging patterns.
 * Heavily based on Mike Anderson's ideas from the "Tyrant" algo, mentioned at
 * http://www.roguebasin.roguelikedevelopment.org/index.php?title=Dungeon-Building_Algorithm.
 * @augments ROT.Map.Dungeon
 */
ROT.Map.Digger = function (width, height, options) {
  ROT.Map.Dungeon.call(this, width, height);

  this._options = {
    roomWidth: [3, 9], /* room minimum and maximum width */
    roomHeight: [3, 5], /* room minimum and maximum height */
    corridorLength: [3, 10], /* corridor minimum and maximum length */
    dugPercentage: 0.2, /* we stop after this percentage of level area has been dug out */
    timeLimit: 1000, /* we stop after this much time has passed (msec) */
  };
  for (const p in options) { this._options[p] = options[p]; }

  this._features = {
    Room: 4,
    Corridor: 4,
  };
  this._featureAttempts = 20; /* how many times do we try to create a feature on a suitable wall */
  this._walls = {}; /* these are available for digging */

  this._digCallback = this._digCallback.bind(this);
  this._canBeDugCallback = this._canBeDugCallback.bind(this);
  this._isWallCallback = this._isWallCallback.bind(this);
  this._priorityWallCallback = this._priorityWallCallback.bind(this);
};
ROT.Map.Digger.extend(ROT.Map.Dungeon);

/**
 * Create a map
 * @see ROT.Map#create
 */
ROT.Map.Digger.prototype.create = function (callback) {
  this._rooms = [];
  this._corridors = [];
  this._map = this._fillMap(1);
  this._walls = {};
  this._dug = 0;
  const area = (this._width - 2) * (this._height - 2);

  this._firstRoom();

  const t1 = Date.now();

  do {
    const t2 = Date.now();
    if (t2 - t1 > this._options.timeLimit) { break; }

    /* find a good wall */
    const wall = this._findWall();
    if (!wall) { break; } /* no more walls */

    const parts = wall.split(',');
    const x = parseInt(parts[0]);
    const y = parseInt(parts[1]);
    const dir = this._getDiggingDirection(x, y);
    if (!dir) { continue; } /* this wall is not suitable */

    //		console.log("wall", x, y);

    /* try adding a feature */
    let featureAttempts = 0;
    do {
      featureAttempts++;
      if (this._tryFeature(x, y, dir[0], dir[1])) { /* feature added */
        // if (this._rooms.length + this._corridors.length == 2) { this._rooms[0].addDoor(x, y); } /* first room oficially has doors */
        this._removeSurroundingWalls(x, y);
        this._removeSurroundingWalls(x - dir[0], y - dir[1]);
        break;
      }
    } while (featureAttempts < this._featureAttempts);

    var priorityWalls = 0;
    for (const id in this._walls) {
      if (this._walls[id] > 1) { priorityWalls++; }
    }
  } while (this._dug / area < this._options.dugPercentage || priorityWalls); /* fixme number of priority walls */

  this._addDoors();

  if (callback) {
    for (let i = 0; i < this._width; i++) {
      for (let j = 0; j < this._height; j++) {
        callback(i, j, this._map[i][j]);
      }
    }
  }

  this._walls = {};
  this._map = null;

  return this;
};

ROT.Map.Digger.prototype._digCallback = function (x, y, value) {
  if (value == 0 || value == 2) { /* empty */
    this._map[x][y] = 0;
    this._dug++;
  } else { /* wall */
    this._walls[`${x},${y}`] = 1;
  }
};

ROT.Map.Digger.prototype._isWallCallback = function (x, y) {
  if (x < 0 || y < 0 || x >= this._width || y >= this._height) { return false; }
  return (this._map[x][y] == 1);
};

ROT.Map.Digger.prototype._canBeDugCallback = function (x, y) {
  if (x < 1 || y < 1 || x + 1 >= this._width || y + 1 >= this._height) { return false; }
  return (this._map[x][y] == 1);
};

ROT.Map.Digger.prototype._priorityWallCallback = function (x, y) {
  this._walls[`${x},${y}`] = 2;
};

ROT.Map.Digger.prototype._firstRoom = function () {
  const cx = Math.floor(this._width / 2);
  const cy = Math.floor(this._height / 2);
  const room = ROT.Map.Feature.Room.createRandomCenter(cx, cy, this._options);
  this._rooms.push(room);
  room.create(this._digCallback);
};

/**
 * Get a suitable wall
 */
ROT.Map.Digger.prototype._findWall = function () {
  const prio1 = [];
  const prio2 = [];
  for (var id in this._walls) {
    const prio = this._walls[id];
    if (prio == 2) {
      prio2.push(id);
    } else {
      prio1.push(id);
    }
  }

  const arr = (prio2.length ? prio2 : prio1);
  if (!arr.length) { return null; } /* no walls :/ */

  var id = arr.sort().random(); // sort to make the order deterministic
  delete this._walls[id];

  return id;
};

/**
 * Tries adding a feature
 * @returns {bool} was this a successful try?
 */
ROT.Map.Digger.prototype._tryFeature = function (x, y, dx, dy) {
  let feature = ROT.RNG.getWeightedValue(this._features);
  feature = ROT.Map.Feature[feature].createRandomAt(x, y, dx, dy, this._options);

  if (!feature.isValid(this._isWallCallback, this._canBeDugCallback)) {
    //		console.log("not valid");
    //		feature.debug();
    return false;
  }

  feature.create(this._digCallback);
  //	feature.debug();

  if (feature instanceof ROT.Map.Feature.Room) { this._rooms.push(feature); }
  if (feature instanceof ROT.Map.Feature.Corridor) {
    feature.createPriorityWalls(this._priorityWallCallback);
    this._corridors.push(feature);
  }

  return true;
};

ROT.Map.Digger.prototype._removeSurroundingWalls = function (cx, cy) {
  const deltas = ROT.DIRS[4];

  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];
    var x = cx + delta[0];
    var y = cy + delta[1];
    delete this._walls[`${x},${y}`];
    var x = cx + 2 * delta[0];
    var y = cy + 2 * delta[1];
    delete this._walls[`${x},${y}`];
  }
};

/**
 * Returns vector in "digging" direction, or false, if this does not exist (or is not unique)
 */
ROT.Map.Digger.prototype._getDiggingDirection = function (cx, cy) {
  if (cx <= 0 || cy <= 0 || cx >= this._width - 1 || cy >= this._height - 1) { return null; }

  let result = null;
  const deltas = ROT.DIRS[4];

  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];
    const x = cx + delta[0];
    const y = cy + delta[1];

    if (!this._map[x][y]) { /* there already is another empty neighbor! */
      if (result) { return null; }
      result = delta;
    }
  }

  /* no empty neighbor */
  if (!result) { return null; }

  return [-result[0], -result[1]];
};

/**
 * Find empty spaces surrounding rooms, and apply doors.
 */
ROT.Map.Digger.prototype._addDoors = function () {
  const data = this._map;
  const isWallCallback = function (x, y) {
    return (data[x][y] == 1);
  };
  for (let i = 0; i < this._rooms.length; i++) {
    const room = this._rooms[i];
    room.clearDoors();
    room.addDoors(isWallCallback);
  }
};
