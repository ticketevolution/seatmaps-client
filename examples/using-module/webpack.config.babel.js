import HtmlWebpackPlugin from 'html-webpack-plugin'
import merge from 'webpack-merge'
import path from 'path'
import base from '../../webpack.config.base.babel'

export default merge(base, {
  mode: 'development',
  devtool: 'cheap-eval-source-map',
  entry: [
    'unfetch/polyfill',
    path.join(__dirname, 'main.js'),
    path.join(__dirname, 'main.css')
  ],
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Ticket Evolution Map',
      template: 'index.html',
      meta: {
        viewport: 'width=device-width, initial-scale=1'
      }
    })
  ],
  performance: {
    hints: false
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: {
          loader: 'html-loader',
          options: {
            minimize: true
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
        ]
      }
    ]
  }
})
