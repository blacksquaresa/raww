const HtmlWebpackPlugin = require('html-webpack-plugin'); // Require  html-webpack-plugin plugin
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: __dirname + "/src/app.ts", // webpack entry point. Module to start building dependency graph
  output: {
    path: __dirname + '/dist', // Folder to store generated bundle
    filename: 'app.js',  // Name of generated bundle after build
    publicPath: '/' // public URL of the output directory when referenced in a browser
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
  plugins: [  // Array of plugins to apply to build chunk
      new HtmlWebpackPlugin({
          template: __dirname + "/src/index.html",
          inject: 'body'
      })
  ],
  optimization: {
    minimizer: [new UglifyJsPlugin(
      {
        uglifyOptions: {
          warnings: false,
          parse: {},
          compress: {},
          mangle: {
            reserved: ['$$$$']
          },
          output: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_fnames: false,
        }
      }
    )]
  },
  devServer: {  // configuration for webpack-dev-server
      contentBase: './src',  //source of static assets
      port: 7700, // port to run dev-server
  } 
};