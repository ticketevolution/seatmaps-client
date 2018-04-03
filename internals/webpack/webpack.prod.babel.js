const path = require('path')

module.exports = require('./webpack.base.babel')({
  entry: [path.join(process.cwd(), 'src/index.js')],
  mode: 'production',
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js'
  },
  performance: {
    assetFilter: assetFilename => !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename)
  }
})
