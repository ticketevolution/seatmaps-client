const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = require('./webpack.base.babel')({
  entry: ['babel-polyfill', path.join(process.cwd(), 'src/index.js')],

  // Don't use hashes in dev mode for better performance
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
  },
  mode: 'development',

  // Add development plugins
  plugins: [
    new webpack.HotModuleReplacementPlugin(), // Tell webpack we want hot reloading
    new HtmlWebpackPlugin({
      title: 'Ticket Evolution Map',
      filename: 'index.html',
      inject: true,
      template: 'src/index.html',
    }),
  ],

  // Emit a source map for easier debugging
  devtool: 'source-map',

  performance: {
    hints: false,
  },
})
