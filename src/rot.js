/**
  * @returns {bool} Is rot.js supported?
  */
export function isSupported() {
  return !!(document.createElement('canvas').getContext && Function.prototype.bind);
}

/** Directional constants. Ordering is important! */
export const DIRS = {
  4: [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ],
  8: [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [2, 0],
    [1, 1],
    [-1, 1],
    [-2, 0],
  ],
};
  /** Cancel key. */
export const KEYS = {
  CANCEL: 3,
  /** Help key. */
  HELP: 6,
  /** Backspace key. */
  BACK_SPACE: 8,
  /** Tab key. */
  TAB: 9,
  /** 5 key on Numpad when NumLock is unlocked. Or on Mac, clear key which is positioned at NumLock key. */
  CLEAR: 12,
  /** Return/enter key on the main keyboard. */
  RETURN: 13,
  /** Reserved, but not used. */
  ENTER: 14,
  /** Shift key. */
  SHIFT: 16,
  /** Control key. */
  CONTROL: 17,
  /** Alt (Option on Mac) key. */
  ALT: 18,
  /** Pause key. */
  PAUSE: 19,
  /** Caps lock. */
  CAPS_LOCK: 20,
  /** Escape key. */
  ESCAPE: 27,
  /** Space bar. */
  SPACE: 32,
  /** Page Up key. */
  PAGE_UP: 33,
  /** Page Down key. */
  PAGE_DOWN: 34,
  /** End key. */
  END: 35,
  /** Home key. */
  HOME: 36,
  /** Left arrow. */
  LEFT: 37,
  /** Up arrow. */
  UP: 38,
  /** Right arrow. */
  RIGHT: 39,
  /** Down arrow. */
  DOWN: 40,
  /** Print Screen key. */
  PRINTSCREEN: 44,
  /** Ins(ert) key. */
  INSERT: 45,
  /** Del(ete) key. */
  DELETE: 46,
  /** */
  0: 48,
  /** */
  1: 49,
  /** */
  2: 50,
  /** */
  3: 51,
  /** */
  4: 52,
  /** */
  5: 53,
  /** */
  6: 54,
  /** */
  7: 55,
  /** */
  8: 56,
  /** */
  9: 57,
  /** Colon (:) key. Requires Gecko 15.0 */
  COLON: 58,
  /** Semicolon (;) key. */
  SEMICOLON: 59,
  /** Less-than (<) key. Requires Gecko 15.0 */
  LESS_THAN: 60,
  /** Equals (=) key. */
  EQUALS: 61,
  /** Greater-than (>) key. Requires Gecko 15.0 */
  GREATER_THAN: 62,
  /** Question mark (?) key. Requires Gecko 15.0 */
  QUESTION_MARK: 63,
  /** Atmark (@) key. Requires Gecko 15.0 */
  AT: 64,
  /** */
  A: 65,
  /** */
  B: 66,
  /** */
  C: 67,
  /** */
  D: 68,
  /** */
  E: 69,
  /** */
  F: 70,
  /** */
  G: 71,
  /** */
  H: 72,
  /** */
  I: 73,
  /** */
  J: 74,
  /** */
  K: 75,
  /** */
  L: 76,
  /** */
  M: 77,
  /** */
  N: 78,
  /** */
  O: 79,
  /** */
  P: 80,
  /** */
  Q: 81,
  /** */
  R: 82,
  /** */
  S: 83,
  /** */
  T: 84,
  /** */
  U: 85,
  /** */
  V: 86,
  /** */
  W: 87,
  /** */
  X: 88,
  /** */
  Y: 89,
  /** */
  Z: 90,
  /** */
  CONTEXT_MENU: 93,
  /** 0 on the numeric keypad. */
  NUMPAD0: 96,
  /** 1 on the numeric keypad. */
  NUMPAD1: 97,
  /** 2 on the numeric keypad. */
  NUMPAD2: 98,
  /** 3 on the numeric keypad. */
  NUMPAD3: 99,
  /** 4 on the numeric keypad. */
  NUMPAD4: 100,
  /** 5 on the numeric keypad. */
  NUMPAD5: 101,
  /** 6 on the numeric keypad. */
  NUMPAD6: 102,
  /** 7 on the numeric keypad. */
  NUMPAD7: 103,
  /** 8 on the numeric keypad. */
  NUMPAD8: 104,
  /** 9 on the numeric keypad. */
  NUMPAD9: 105,
  /** * on the numeric keypad. */
  MULTIPLY: 106,
  /** + on the numeric keypad. */
  ADD: 107,
  /** */
  SEPARATOR: 108,
  /** - on the numeric keypad. */
  SUBTRACT: 109,
  /** Decimal point on the numeric keypad. */
  DECIMAL: 110,
  /** / on the numeric keypad. */
  DIVIDE: 111,
  /** F1 key. */
  F1: 112,
  /** F2 key. */
  F2: 113,
  /** F3 key. */
  F3: 114,
  /** F4 key. */
  F4: 115,
  /** F5 key. */
  F5: 116,
  /** F6 key. */
  F6: 117,
  /** F7 key. */
  F7: 118,
  /** F8 key. */
  F8: 119,
  /** F9 key. */
  F9: 120,
  /** F10 key. */
  F10: 121,
  /** F11 key. */
  F11: 122,
  /** F12 key. */
  F12: 123,
  /** F13 key. */
  F13: 124,
  /** F14 key. */
  F14: 125,
  /** F15 key. */
  F15: 126,
  /** F16 key. */
  F16: 127,
  /** F17 key. */
  F17: 128,
  /** F18 key. */
  F18: 129,
  /** F19 key. */
  F19: 130,
  /** F20 key. */
  F20: 131,
  /** F21 key. */
  F21: 132,
  /** F22 key. */
  F22: 133,
  /** F23 key. */
  F23: 134,
  /** F24 key. */
  F24: 135,
  /** Num Lock key. */
  NUM_LOCK: 144,
  /** Scroll Lock key. */
  SCROLL_LOCK: 145,
  /** Circumflex (^) key. Requires Gecko 15.0 */
  CIRCUMFLEX: 160,
  /** Exclamation (!) key. Requires Gecko 15.0 */
  EXCLAMATION: 161,
  /** Double quote () key. Requires Gecko 15.0 */
  DOUBLE_QUOTE: 162,
  /** Hash (#) key. Requires Gecko 15.0 */
  HASH: 163,
  /** Dollar sign ($) key. Requires Gecko 15.0 */
  DOLLAR: 164,
  /** Percent (%) key. Requires Gecko 15.0 */
  PERCENT: 165,
  /** Ampersand (&) key. Requires Gecko 15.0 */
  AMPERSAND: 166,
  /** Underscore (_) key. Requires Gecko 15.0 */
  UNDERSCORE: 167,
  /** Open parenthesis (() key. Requires Gecko 15.0 */
  OPEN_PAREN: 168,
  /** Close parenthesis ()) key. Requires Gecko 15.0 */
  CLOSE_PAREN: 169,
  /* Asterisk (*) key. Requires Gecko 15.0 */
  ASTERISK: 170,
  /** Plus (+) key. Requires Gecko 15.0 */
  PLUS: 171,
  /** Pipe (|) key. Requires Gecko 15.0 */
  PIPE: 172,
  /** Hyphen-US/docs/Minus (-) key. Requires Gecko 15.0 */
  HYPHEN_MINUS: 173,
  /** Open curly bracket ({) key. Requires Gecko 15.0 */
  OPEN_CURLY_BRACKET: 174,
  /** Close curly bracket (}) key. Requires Gecko 15.0 */
  CLOSE_CURLY_BRACKET: 175,
  /** Tilde (~) key. Requires Gecko 15.0 */
  TILDE: 176,
  /** Comma (,) key. */
  COMMA: 188,
  /** Period (.) key. */
  PERIOD: 190,
  /** Slash (/) key. */
  SLASH: 191,
  /** Back tick (`) key. */
  BACK_QUOTE: 192,
  /** Open square bracket ([) key. */
  OPEN_BRACKET: 219,
  /** Back slash (\) key. */
  BACK_SLASH: 220,
  /** Close square bracket (]) key. */
  CLOSE_BRACKET: 221,
  /** Quote (''') key. */
  QUOTE: 222,
  /** Meta key on Linux, Command key on Mac. */
  META: 224,
  /** AltGr key on Linux. Requires Gecko 15.0 */
  ALTGR: 225,
  /** Windows logo key on Windows. Or Super or Hyper key on Linux. Requires Gecko 15.0 */
  WIN: 91,
  /** Linux support for this keycode was added in Gecko 4.0. */
  KANA: 21,
  /** Linux support for this keycode was added in Gecko 4.0. */
  HANGUL: 21,
  /** 英数 key on Japanese Mac keyboard. Requires Gecko 15.0 */
  EISU: 22,
  /** Linux support for this keycode was added in Gecko 4.0. */
  JUNJA: 23,
  /** Linux support for this keycode was added in Gecko 4.0. */
  FINAL: 24,
  /** Linux support for this keycode was added in Gecko 4.0. */
  HANJA: 25,
  /** Linux support for this keycode was added in Gecko 4.0. */
  KANJI: 25,
  /** Linux support for this keycode was added in Gecko 4.0. */
  CONVERT: 28,
  /** Linux support for this keycode was added in Gecko 4.0. */
  NONCONVERT: 29,
  /** Linux support for this keycode was added in Gecko 4.0. */
  ACCEPT: 30,
  /** Linux support for this keycode was added in Gecko 4.0. */
  MODECHANGE: 31,
  /** Linux support for this keycode was added in Gecko 4.0. */
  SELECT: 41,
  /** Linux support for this keycode was added in Gecko 4.0. */
  PRINT: 42,
  /** Linux support for this keycode was added in Gecko 4.0. */
  EXECUTE: 43,
  /** Linux support for this keycode was added in Gecko 4.0. */
  SLEEP: 95,
};
