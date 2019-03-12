import CompressionPlugin from 'compression-webpack-plugin'
import merge from 'webpack-merge'
import path from 'path'
import base from './webpack.config.base.babel'

export default merge(base, {
  mode: 'production',
  entry: ['unfetch/polyfill', path.join(__dirname, 'src', 'index.tsx')],
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
    library: {
      root: 'Tevomaps',
      amd: 'ticket-evolution-seatmaps',
      commonjs: 'ticket-evolution-seatmaps'
    },
    libraryTarget: 'umd',
    libraryExport: 'default',
    filename: 'tevomaps.js'
  },
  plugins: [
    new CompressionPlugin({
      test: /\.js$|\.css$|\.html$/,
      cache: true,
      minRatio: 0.8
    })
  ]
})
