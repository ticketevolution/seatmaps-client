import path from 'path'
import webpack from 'webpack'

export default {
  entry: ['@babel/polyfill', path.join(__dirname, 'src', 'index.js')],
  output: {
    path: path.resolve(process.cwd(), 'build'),
    publicPath: '/',
    library: {
      root: 'Tevomaps',
      amd: 'ticket-evolution-seatmaps',
      commonjs: 'ticket-evolution-seatmaps'
    },
    libraryTarget: 'umd',
    filename: 'tevomaps.js',
    chunkFilename: '[name].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env", "@babel/preset-flow"],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              ["@babel/plugin-transform-react-jsx", { "pragma": "h" }]
            ]
          },
        },
      }
    ]
  },
  plugins: [
    // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
    // inside your code for any environment checks; UglifyJS will automatically
    // drop any unreachable code.
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT),
      },
    }),
  ],
  mode: 'development',
  resolve: {
    alias: {
      react: 'preact-compat',
      'react-dom': 'preact-compat',
    },
    modules: ['src', 'node_modules'],
    extensions: ['.js', '.jsx', '.json'],
    mainFields: ['jsnext:main', 'main'],
  },
  target: 'web', // Make web variables accessible to webpack, e.g. window
  performance: {}
}
