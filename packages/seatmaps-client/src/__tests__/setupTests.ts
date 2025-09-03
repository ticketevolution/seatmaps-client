import { GlobalWithFetchMock } from "jest-fetch-mock";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import { expect } from "@jest/globals";
import "./setup-jsdom-svg";

const customGlobal: GlobalWithFetchMock =
  global as unknown as GlobalWithFetchMock;
customGlobal.fetch = require("jest-fetch-mock");
customGlobal.fetchMock = customGlobal.fetch;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

declare module "@jest/expect" {
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  export interface Matchers<R extends void | Promise<void>, T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, R> {}
}
