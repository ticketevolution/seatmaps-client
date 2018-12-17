import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import merge from 'webpack-merge'
import base from './webpack.base.babel'

export default merge(base, {
  // Don't use hashes in dev mode for better performance
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
  },
  mode: 'development',

  // Add development plugins
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Ticket Evolution Map',
      filename: 'index.html',
      inject: true,
      template: path.join(process.cwd(), 'src', 'index.html'),
    }),
  ],

  // Emit a source map for easier debugging
  devtool: 'source-map',

  performance: {
    hints: false,
  },
})
