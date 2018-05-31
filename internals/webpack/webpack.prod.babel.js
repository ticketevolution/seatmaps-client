const path = require('path')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = require('./webpack.base.babel')({
  entry: [path.join(process.cwd(), 'src/index.js')],
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
