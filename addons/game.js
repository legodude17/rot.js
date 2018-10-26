import SpeedScheduler from '../src/scheduler/scheduler-speed';
import Engine from '../src/engine';
import TextBuffer from './textbuffer';
import Display from '../src/display/display';
import Player from './player';
import Level from './level';
import XY from './xy';

export default {
  scheduler: null,
  engine: null,
  player: null,
  level: null,
  display: null,
  textBuffer: null,

  init() {
    window.addEventListener('load', this);
  },

  handleEvent(e) {
    switch (e.type) {
    case 'load': {
      window.removeEventListener('load', this);

      this.scheduler = new SpeedScheduler();
      this.engine = new Engine(this.scheduler);
      this.display = new Display({ fontSize: 16 });
      this.textBuffer = new TextBuffer(this.display);
      document.body.appendChild(this.display.getContainer());
      this.player = new Player();

      /* FIXME build a level and position a player */
      const level = new Level();
      const size = level.getSize();
      this._switchLevel(level);
      this.level.setEntity(this.player, new XY(Math.round(size.x / 2), Math.round(size.y / 2)));

      this.engine.start();
      break;
    }
    default: break;
    }
  },

  draw(xy) {
    var entity = this.level.getEntityAt(xy);
    var visual = entity.getVisual();
    this.display.draw(xy.x, xy.y, visual.ch, visual.fg, visual.bg);
  },

  over() {
    this.engine.lock();
    /* FIXME show something */
  },

  _switchLevel(level) {
    /* remove old beings from the scheduler */
    this.scheduler.clear();

    this.level = level;
    const size = this.level.getSize();

    const bufferSize = 3;
    this.display.setOptions({ width: size.x, height: size.y + bufferSize });
    this.textBuffer.configure({
      display: this.display,
      position: new XY(0, size.y),
      size: new XY(size.x, bufferSize)
    });
    this.textBuffer.clear();

    /* FIXME draw a level */
    const xy = new XY();
    for (let i = 0; i < size.x; i++) {
      xy.x = i;
      for (let j = 0; j < size.y; j++) {
        xy.y = j;
        this.draw(xy);
      }
    }

    /* add new beings to the scheduler */
    const beings = this.level.getBeings();
    for (const p in beings) {
      if (beings.hasOwnProperty(p)) this.scheduler.add(beings[p], true);
    }
  }
};
