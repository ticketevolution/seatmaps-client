import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'

export const absolute = (...p) => path.join(__dirname, ...p)

export default {
    entry: {
        example: absolute('main.js')
    },
    output: {
        path: absolute('dist'),
        filename: '[name].[chunkhash].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Sitemaps Example',
            template: absolute('index.html')
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contentHash].css'
        })
    ],
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
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
            }, {
                test: /\.s?css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[path][name]-[local]-[hash:base64:5]'
                        }
                    },
                    'sass-loader'
                ]
            }, {
                test: /\.html$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        minimize: true
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
    }
}