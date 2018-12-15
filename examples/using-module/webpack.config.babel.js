import HtmlWebpackPlugin from 'html-webpack-plugin'
import merge from 'webpack-merge'
import path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import base from '../../webpack.config.base.babel'

export default merge(base, {
  mode: 'development',
  devtool: 'source-map',
  entry: [
    'unfetch/polyfill',
    path.join(__dirname, 'main.js'),
    path.join(__dirname, 'main.scss')
  ],
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Ticket Evolution Map',
      filename: 'index.html',
      inject: true,
      template: 'index.html'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
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
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          'sass-loader'
        ]
      }
    ]
  }
})
