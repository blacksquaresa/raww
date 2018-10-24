const HtmlWebpackPlugin = require('html-webpack-plugin'); // Require  html-webpack-plugin plugin

module.exports = {
  entry: __dirname + "/src/app.js", // webpack entry point. Module to start building dependency graph
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
  devServer: {  // configuration for webpack-dev-server
      contentBase: './src',  //source of static assets
      port: 7700, // port to run dev-server
  } 
};