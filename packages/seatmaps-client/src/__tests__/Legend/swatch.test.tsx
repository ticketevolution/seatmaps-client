import React from "react";
import { render } from "@testing-library/react";
import Swatch from "../../Legend/swatch";
import { describe, expect, it } from "@jest/globals";

describe("Swatch", () => {
  it("renders", () => {
    const { container } = render(<Swatch color="#000" />);
    expect(container.firstChild).toBeTruthy();
  });
});
