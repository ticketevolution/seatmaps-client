// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '.+\\.(svg|png|jpg)$': 'identity-obj-proxy',
    '^lodash-es$': '<rootDir>/node_modules/lodash/index.js'
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: [
    './node_modules/jest-enzyme/lib/index.js',
    '<rootDir>/src/setupTests.ts'
  ],
  transformIgnorePatterns: [
    '/node_modules/?!(lodash-es)'
  ]
}
