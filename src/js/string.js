/**
 * @returns {string} First letter capitalized
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

/**
 * Left pad
 * @param {string} [character="0"]
 * @param {int} [count=2]
 */
export function lpad(str, character, count) {
  const ch = character || '0';
  const cnt = count || 2;

  let s = '';
  while (s.length < (cnt - str.length)) { s += ch; }
  s = s.substring(0, cnt - str.length);
  return s + this;
}

/**
 * Right pad
 * @param {string} [character="0"]
 * @param {int} [count=2]
 */
export function rpad(str, character, count) {
  const ch = character || '0';
  const cnt = count || 2;

  let s = '';
  while (s.length < (cnt - str.length)) { s += ch; }
  s = s.substring(0, cnt - str.length);
  return this + s;
}

/**
 * Format a string in a flexible way. Scans for %s strings and replaces them with arguments. List of patterns is modifiable via String.format.map.
 * @param {string} template
 * @param {any} [argv]
 */
export function format(template, ...args) {
  const { map } = format;

  const replacer = function replacer(match, group1, group2, index) {
    if (template.charAt(index - 1) === '%') { return match.substring(1); }
    if (!args.length) { return match; }
    let [obj] = args;

    const group = group1 || group2;
    const parts = group.split(',');
    const name = parts.shift();
    const method = map[name.toLowerCase()];
    if (!method) { return match; }

    obj = args.shift();
    let replaced = obj[method](...parts);

    const first = name.charAt(0);
    if (first !== first.toLowerCase()) { replaced = capitalize(replaced); }

    return replaced;
  };
  return template.replace(/%(?:([a-z]+)|(?:{([^}]+)}))/gi, replacer);
}

format.map = {
  s: 'toString',
};
