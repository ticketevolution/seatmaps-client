import { Config } from "jest";

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
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTests.ts"],
  testEnvironment: "jsdom",
  transform: {
    "\\.(js|mjs|ts)$": ["@swc/jest", {}],
    "^.+\\.jsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "ecmascript",
            jsx: true,
            decorators: false,
            dynamicImport: false,
          },
        },
      },
    ],
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            jsx: true,
            decorators: false,
            dynamicImport: false,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
            hidden: {
              jest: true,
            },
          },
        },
      },
    ],
  },
} satisfies Config;
