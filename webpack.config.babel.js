import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import path from 'path'

export const absolute = (...p) => path.join(__dirname, ...p)

export default {
    mode: 'production',
    devtool: 'none',
    entry: absolute('lib', 'index.js'),
    output: {
        path: absolute('dist'),
        filename: '[name].min.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                useBuiltIns: 'entry'
                            }],
                            '@babel/preset-flow',
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-syntax-jsx',
                            ['@babel/plugin-transform-react-jsx', {
                                pragma: 'h',
                            }]
                        ]
                    }
                }
            }
        ]
    },
    resolve: {
        alias: {
            'react': 'preact-compat',
            'react-dom': 'preact-compat'
        }
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true
            })
        ]
    }
}