// This file imports everything in order to convice rollup to compile it all

import * as ROT from './rot';
import * as RNG from './rng';
import * as Text from './text';
import StringGenerator from './stringgenerator';
import Lighting from './lighting';
import EventQueue from './eventqueue';
import Engine from './engine';
import * as Color from './color';
import Scheduler from './scheduler/scheduler';
import SpeedScheduler from './scheduler/scheduler-speed';
import SimpleSchedulere from './scheduler/scheduler-simple';
import ActionScheduler from './scheduler/scheduler-action';
import Dijkstra from './path/dijkstra';
import AStar from './path/astar';
import SimplexNoise from './noise/simplex';
import UniformDungeon from './map/uniform';
import RogueMap from './map/rogue';
import IceyMaze from './map/iceymaze';
import * as Features from './map/features';
import EllerMaze from './map/ellermaze';
import Dungeon from './map/dungeon';
import DiggerMap from './map/digger';
import CellularMap from './map/cellular';
import Arena from './map/arena';
import * as ARRAY from './js/array';
import extend from './js/function';
import mod from './js/number';
import * as RAF from './js/raf';
import * as STRING from './js/string';
import DiscreteShadowcasting from './fov/discrete-shadowcasting';
import PreciseShadowcasting from './fov/precise-shadowcasting';
import RecursiveShadowcasting from './fov/recursive-shadowcasting';
import Display from './display/display';

ROT.RNG = RNG;
ROT.Text = Text;
ROT.StringGenerator = StringGenerator;
ROT.Lighting = Lighting;
ROT.EventQueue = EventQueue;
ROT.Engine = Engine;
ROT.Color = Color;
ROT.Scheduler = Scheduler;
ROT.Scheduler.Speed = SpeedScheduler;
ROT.Scheduler.Action = ActionScheduler;
ROT.Scheduler.Simple = SimpleSchedulere;
ROT.Path = { AStar, Dijkstra };
ROT.Noise = { Simplex: SimplexNoise };
ROT.Map = {
  UniformDungeon,
  Rogue: RogueMap,
  IceyMaze,
  EllerMaze,
  Dungeon,
  Digger: DiggerMap,
  Cellular: CellularMap,
  Arena,
  Features
};
ROT.Array = ARRAY;
ROT.Function = { extend };
ROT.Number = { mod };
ROT.RAF = RAF;
ROT.String = STRING;
ROT.Shadowcasting = {
  Precise: PreciseShadowcasting,
  Recursive: RecursiveShadowcasting,
  Discrete: DiscreteShadowcasting
};
ROT.Display = Display;

export default ROT;
