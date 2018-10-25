export const requestAnimationFrame = window.requestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.oRequestAnimationFrame
  || window.msRequestAnimationFrame
  || function requestAnimationFramePolyfill(cb) { return setTimeout(() => { cb(Date.now()); }, 1000 / 60); };

export const cancelAnimationFrame = window.cancelAnimationFrame
  || window.mozCancelAnimationFrame
  || window.webkitCancelAnimationFrame
  || window.oCancelAnimationFrame
  || window.msCancelAnimationFrame
  || function cancelAnimationFramePolyfill(id) { return clearTimeout(id); };
