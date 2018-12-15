import CompressionPlugin from 'compression-webpack-plugin'
import merge from 'webpack-merge'
import base from './webpack.config.base.babel'

export default merge(base, {
  mode: 'production',
  plugins: [
    new CompressionPlugin({
      test: /\.js$|\.css$|\.html$/,
      cache: true,
      minRatio: 0.8
    })
  ],
  performance: {
    assetFilter: assetFilename => !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename)
  }
})
