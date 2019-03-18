// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '.+\\.(svg|png|jpg)$': 'identity-obj-proxy'
  },
  preset: 'ts-jest/presets/js-with-ts',
  transformIgnorePatterns: [
    '/node_modules/?!(lodash-es)'
  ]
}
