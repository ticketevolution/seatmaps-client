import merge from 'webpack-merge'
import config from './webpack.config.common.babel'

export default merge(config, {
    mode: 'development',
    devtool: 'cheap-eval-source-map'
})