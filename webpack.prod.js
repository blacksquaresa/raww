const HtmlWebpackPlugin = require('html-webpack-plugin'); // Require  html-webpack-plugin plugin
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    raww: __dirname + "/src/raww.ts"
  },
  output: {
    path: __dirname + '/lib', // Folder to store generated bundle
    filename: '[name].js',  // Name of generated bundle after build
    library: 'raww'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  plugins: [],
  optimization: {
    minimizer: [new UglifyJsPlugin(
      {
        uglifyOptions: {
          warnings: false,
          mangle: {
            reserved: ['$$$$']
          }
        }
      }
    )]
  }
};