// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  testMatch: [
    "**/__tests__/**/*test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  clearMocks: true,
  collectCoverageFrom: ["!src/declarations", "**/*.{ts,tsx}"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    ".+\\.(svg|png|jpg)$": "identity-obj-proxy",
    "^lodash-es$": "<rootDir>/node_modules/lodash/index.js",
  },
  preset: "ts-jest",
  setupFilesAfterEnv: [
    "<rootDir>/node_modules/jest-enzyme/lib/index.js",
    "<rootDir>/src/__tests__/setupTests.ts",
  ],
  transformIgnorePatterns: ["/node_modules/?!(lodash-es)"],
};
