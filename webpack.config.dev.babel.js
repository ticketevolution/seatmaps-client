import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import merge from 'webpack-merge'
import base from './webpack.config.base.babel'

export default merge(base, {
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Ticket Evolution Map',
      filename: 'index.html',
      inject: true,
      template: path.join(__dirname, 'src', 'index.html')
    })
  ],
  devtool: 'source-map',
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
      }
    ]
  }
})
