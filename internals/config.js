const resolve = require('path').resolve
const pullAll = require('lodash/pullAll')
const uniq = require('lodash/uniq')

const seatmaps = {
  version: '0.0.1',
  dllPlugin: {
    defaults: {
      /**
       * we need to exclude dependencies which are not intended for the browser
       * by listing them here.
       */
      exclude: [
        'chalk',
        'compression',
        'cross-env',
        'express',
        'ip',
        'minimist',
        'body-parser',
        'bluebird',
        'unirest'
      ],

      /**
       * Specify any additional dependencies here. We include core-js and lodash
       * since a lot of our dependencies depend on them and they get picked up by webpack.
       */
      include: ['core-js', 'eventsource-polyfill', 'babel-polyfill', 'lodash'],

      // The path where the DLL manifest and bundle will get built
      path: resolve('../node_modules/seatmaps-dlls')
    },

    entry (pkg) {
      const dependencyNames = Object.keys(pkg.dependencies)
      const exclude =
        pkg.dllPlugin.exclude || seatmaps.dllPlugin.defaults.exclude
      const include =
        pkg.dllPlugin.include || seatmaps.dllPlugin.defaults.include
      const includeDependencies = uniq(dependencyNames.concat(include))

      return {
        seatmapsDeps: pullAll(includeDependencies, exclude)
      }
    }
  }
}

module.exports = seatmaps
