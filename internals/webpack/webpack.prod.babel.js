import CompressionPlugin from 'compression-webpack-plugin'
import merge from 'webpack-merge'
import base from './webpack.base.babel'

export default merge(base, {
  mode: 'production',
  output: {
    filename: 'tevomaps.js',
    chunkFilename: '[name].chunk.js',
  },
  plugins: [
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],
  performance: {
    assetFilter: assetFilename => !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename),
  },
})
