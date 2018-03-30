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
              optipng: {
                optimizationLevel: 7
              },
              mozjpeg: {
                progressive: true
              },
              gifsicle: {
                interlaced: false
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
        test: /\.(mp4|webm)$/,
        use: 'url-loader?limit=10000'
      }
    ]
  },
  plugins: options.plugins.concat([
    // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
    // inside your code for any environment checks; UglifyJS will automatically
    // drop any unreachable code.
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT)
      }
    })
  ]),
  mode: 'development' || options.mode,
  resolve: {
    alias: {
      react: 'preact'
    },
    modules: ['src', 'node_modules'],
    extensions: ['.js', '.jsx', '.json'],
    mainFields: ['jsnext:main', 'main']
  },
  devtool: options.devtool,
  target: 'web', // Make web variables accessible to webpack, e.g. window
  performance: options.performance || {}
})
