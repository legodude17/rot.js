/* eslint-disable no-console */

const fs = require('fs');
const { version } = require('./package.json');
const base = require('./package-base.json');
const es = require('./package-es.json');
const js = require('./package-js.json');

base.version = version;
es.version = version;
js.version = version;

fs.writeFileSync('package-base.json', JSON.stringify(base, null, 2));
fs.writeFileSync('package-es.json', JSON.stringify(es, null, 2));
fs.writeFileSync('package-js.json', JSON.stringify(js, null, 2));

fs.writeFileSync('VERSION', version);

console.log('Done!');
