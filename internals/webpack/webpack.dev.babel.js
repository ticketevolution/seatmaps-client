const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const logger = require('../../server/config/logger')
const glob = require('glob')
const pkg = require(path.resolve(process.cwd(), 'package.json'))
const dllPlugin = pkg.dllPlugin

const plugins = [
  new webpack.HotModuleReplacementPlugin(), // Tell webpack we want hot reloading
  new HtmlWebpackPlugin({
    title: 'Ticket Evolution Map',
    filename: 'index.html',
    inject: true,
    template: 'src/index.html'
  })
]

if (dllPlugin) {
  glob.sync(`${dllPlugin.path}/*.dll.js`).forEach(dllPath => {
    plugins.push(
      new AddAssetHtmlPlugin({
        filepath: dllPath,
        includeSourcemap: false
      })
    )
  })
}

module.exports = require('./webpack.base.babel')({
  entry: [
    'webpack-hot-middleware/client?reload=true',
    path.join(process.cwd(), 'src/index.js')
  ],

  // Don't use hashes in dev mode for better performance
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js'
  },

  // Add development plugins
  plugins: dependencyHandlers().concat(plugins),

  // Emit a source map for easier debugging
  devtool: 'source-map',

  performance: {
    hints: false
  }
})

/**
 * Select which plugins to use to optimize the bundle's handling of
 * third party dependencies.
 *
 * If there is a dllPlugin key on the project's package.json, the
 * Webpack DLL Plugin will be used.  Otherwise the CommonsChunkPlugin
 * will be used.
 *
 */
function dependencyHandlers () {
  // Don't do anything during the DLL Build step
  if (process.env.BUILDING_DLL) {
    return []
  }

  const dllPath = path.resolve(
    process.cwd(),
    dllPlugin.path || 'node_modules/seatmaps-dlls'
  )

  /**
   * If DLLs aren't explicitly defined, we assume all production dependencies listed in package.json
   * Reminder: You need to exclude any server side dependencies by listing them in dllConfig.exclude
   */
  if (!dllPlugin.dlls) {
    const manifestPath = path.resolve(dllPath, 'seatmapsDeps.json')

    if (!fs.existsSync(manifestPath)) {
      logger.error(
        'The DLL manifest is missing. Please run `npm run build:dll`'
      )
      process.exit(0)
    }

    return [
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: require(manifestPath)
      })
    ]
  }

  // If DLLs are explicitly defined, we automatically create a DLLReferencePlugin for each of them.
  const dllManifests = Object.keys(dllPlugin.dlls).map(name =>
    path.join(dllPath, `/${name}.json`)
  )

  return dllManifests.map(manifestPath => {
    if (!fs.existsSync(path)) {
      if (!fs.existsSync(manifestPath)) {
        logger.error(
          `The following Webpack DLL manifest is missing: ${path.basename(
            manifestPath
          )}`
        )
        logger.error(`Expected to find it in ${dllPath}`)
        logger.error('Please run: npm run build:dll')

        process.exit(0)
      }
    }

    return new webpack.DllReferencePlugin({
      context: process.cwd(),
      manifest: require(manifestPath)
    })
  })
}
