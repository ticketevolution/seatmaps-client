import path from 'path'

export default {
  module: {
    rules: [
      {
        test: /\.m?(js|ts)$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/unfetch')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: 'last 2 versions',
                useBuiltIns: 'usage'
              }]
            ],
            plugins: [
              'babel-plugin-react-require',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-react-jsx'
            ]
          }
        }
      },
      {
        test: /\.svg$/,
        use: 'url-loader'
      }
    ]
  },
  resolve: {
    alias: {
      react: 'preact-compat',
      'react-dom': 'preact-compat'
    }
  }
}
