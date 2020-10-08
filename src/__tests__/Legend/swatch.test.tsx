import "jest-enzyme";

import React from "react";
import { shallow } from "enzyme";

import Swatch from "../../Legend/swatch";

describe("Swatch", () => {
  it("renders", () => {
    expect(shallow(<Swatch color="#000" />)).toExist();
  });
});
