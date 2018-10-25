/**
 * @returns {string} First letter capitalized
 */
String.prototype.capitalize = String.prototype.capitalize || function () {
  return this.charAt(0).toUpperCase() + this.substring(1);
};

/**
 * Left pad
 * @param {string} [character="0"]
 * @param {int} [count=2]
 */
String.prototype.lpad = String.prototype.lpad || function (character, count) {
  const ch = character || '0';
  const cnt = count || 2;

  let s = '';
  while (s.length < (cnt - this.length)) { s += ch; }
  s = s.substring(0, cnt - this.length);
  return s + this;
};

/**
 * Right pad
 * @param {string} [character="0"]
 * @param {int} [count=2]
 */
String.prototype.rpad = String.prototype.rpad || function (character, count) {
  const ch = character || '0';
  const cnt = count || 2;

  let s = '';
  while (s.length < (cnt - this.length)) { s += ch; }
  s = s.substring(0, cnt - this.length);
  return this + s;
};

/**
 * Format a string in a flexible way. Scans for %s strings and replaces them with arguments. List of patterns is modifiable via String.format.map.
 * @param {string} template
 * @param {any} [argv]
 */
String.format = String.format || function (template) {
  const map = String.format.map;
  const args = Array.prototype.slice.call(arguments, 1);

  const replacer = function (match, group1, group2, index) {
    if (template.charAt(index - 1) == '%') { return match.substring(1); }
    if (!args.length) { return match; }
    var obj = args[0];

    const group = group1 || group2;
    const parts = group.split(',');
    const name = parts.shift();
    const method = map[name.toLowerCase()];
    if (!method) { return match; }

    var obj = args.shift();
    let replaced = obj[method](...parts);

    const first = name.charAt(0);
    if (first != first.toLowerCase()) { replaced = replaced.capitalize(); }

    return replaced;
  };
  return template.replace(/%(?:([a-z]+)|(?:{([^}]+)}))/gi, replacer);
};

String.format.map = String.format.map || {
  s: 'toString',
};

/**
 * Convenience shortcut to String.format(this)
 */
String.prototype.format = String.prototype.format || function () {
  const args = Array.prototype.slice.call(arguments);
  args.unshift(this);
  return String.format(...args);
};
