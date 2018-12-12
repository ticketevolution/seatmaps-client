const pullAll = require('lodash/pullAll')
const uniq = require('lodash/uniq')

const seatmaps = {
  version: '0.0.1',

  entry(pkg) {
    const dependencyNames = Object.keys(pkg.dependencies)
    const includeDependencies = uniq(dependencyNames.concat(include))

    return {
      seatmapsDeps: pullAll(includeDependencies, exclude),
    }
  },
}

module.exports = seatmaps
