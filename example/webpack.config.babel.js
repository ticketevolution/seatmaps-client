import merge from 'webpack-merge'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import config from './webpack.config.common.babel'

export default merge(config, {
    mode: 'production',
    devtool: 'none',
    optimization: {
        minimizer: [
          new UglifyJsPlugin({
            cache: true,
            parallel: true
          }),
          new OptimizeCssAssetsPlugin()
        ],
        splitChunks: {
          chunks: 'all'
        }
      }
})