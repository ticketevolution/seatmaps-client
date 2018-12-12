import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import merge from 'webpack-merge'
import base from './webpack.config.base.babel'

export default merge(base, {
  mode: 'development',

  // Add development plugins
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Ticket Evolution Map',
      filename: 'index.html',
      inject: true,
      template: path.join(__dirname, 'src', 'index.html'),
    }),
  ],

  // Emit a source map for easier debugging
  devtool: 'source-map',

  performance: {
    hints: false,
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
})
