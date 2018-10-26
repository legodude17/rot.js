import serve from 'rollup-plugin-serve';

export default {
  input: 'entry.js',
  output: {
    file: 'script.js',
    format: 'iife'
  },
  plugins: [serve({
    open: true,
    verbose: true,
    openPage: '/',
    contentBase: '.',
    historyApiFallback: true,
    host: 'localhost',
    port: 8000
  })]
};
