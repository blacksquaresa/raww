const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: __dirname + "/src/demo.ts",
  output: {
    path: __dirname + '/demo', // Folder to store generated bundle
    filename: 'demo.js',  // Name of generated bundle after build
    publicPath: '/demo' // public URL of the output directory when referenced in a browser
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