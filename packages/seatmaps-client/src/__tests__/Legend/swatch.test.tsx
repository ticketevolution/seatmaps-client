import "jest-enzyme";

import React from "react";
import { shallow } from "enzyme";

import Swatch from "../../Legend/swatch";
import { describe, expect, it } from "@jest/globals";

describe("Swatch", () => {
  it("renders", () => {
    expect(shallow(<Swatch color="#000" />).isEmptyRender()).toEqual(false);
  });
});
