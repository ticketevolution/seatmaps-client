import { DefinePlugin } from 'webpack'

export default {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: 'last 2 versions',
                useBuiltIns: 'usage'
              }],
              '@babel/preset-flow'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              ['@babel/plugin-transform-react-jsx', {
                'pragma': 'h'
              }]
            ]
          }
        }
      }
    ]
  },
  plugins: [
    // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
    // inside your code for any environment checks; UglifyJS will automatically
    // drop any unreachable code.
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT)
      }
    })
  ],
  resolve: {
    alias: {
      react: 'preact-compat',
      'react-dom': 'preact-compat'
    }
  }
}
