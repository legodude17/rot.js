export default [{
  input: 'src/everything.js',
  output: {
    file: 'dist/rot.js',
    format: 'cjs'
  }
}, {
  input: 'addons/everything.js',
  output: {
    file: 'dist/addons.js',
    format: 'cjs'
  }
}];
