const path = require('path')
const webpack = require('webpack')

module.exports = options => ({
  entry: options.entry,
  output: Object.assign(
    {
      path: path.resolve(process.cwd(), 'build'),
      publicPath: '/'
    },
    options.output
  ), // Merge with env dependent settings
  module: {
    rules: [
      {
        test: /\.js$/, // Transform all .js files required somewhere with Babel
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: options.babelQuery
        }
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: 'file-loader'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            query: {
              pngquant: {
                quality: '65-90',
                speed: 4
              },
              mozjpeg: {
                progressive: true
              },
              gifsicle: {
                interlaced: false
              },
              optipng: {
                optimizationLevel: 7
              }
            }
          }
        ]
      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },
      {
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        test: /\.(mp4|webm)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }
      }
    ]
  },
  // plugins: options.plugins.concat([
  //   new webpack.ProvidePlugin({
  //     // make fetch available
  //     fetch: 'exports-loader?self.fetch!whatwg-fetch'
  //   }),
  //   new webpack.DefinePlugin({
  //     'process.env': {
  //       NODE_ENV: JSON.stringify(process.env.NODE_ENV),
  //       DEFAULT_HOST: JSON.stringify(process.env.DEFAULT_HOST)
  //     }
  //   })
  // ]),
  resolve: {
    modules: ['src', 'node_modules'],
    extensions: ['.js'],
    mainFields: ['browser', 'jsnext:main', 'main']
  },
  devtool: options.devtool,
  target: 'web', // Make web variables accessible to webpack, e.g. window
  node: {
    fs: 'empty',
    net: 'empty'
  },
  performance: options.performance || {}
})
