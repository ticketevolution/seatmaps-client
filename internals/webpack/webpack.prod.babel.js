const path = require('path')

module.exports = require('./webpack.base.babel')({
  entry: [path.join(process.cwd(), 'src/index.js')],

  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js'
  },
  performance: {
    assetFilter: assetFilename =>
      !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename)
  }
})
