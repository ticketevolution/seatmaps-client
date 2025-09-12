import React from "react";
import Legend, { Props, Range } from "../../Legend/index";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("Legend", () => {
  let rangeMock: Range;
  let props: Props;

  beforeEach(() => {
    rangeMock = { color: "#c00", min: 0, max: 10 };
    props = { ranges: [] };
  });

  it("renders", () => {
    render(<Legend {...props} />);
    expect(screen.getByText(/show map legend/i)).toBeInTheDocument();
  });

  it("renders a button", () => {
    render(<Legend {...props} />);
    expect(screen.getByText(/show map legend/i)).toBeInTheDocument();
  });

  describe("Button", () => {
    it("toggles the dropdown open/closed", () => {
      render(<Legend {...props} ranges={[rangeMock]} />);
      const button = screen.getByText(/show map legend/i);

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.getByText(/\$/)).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe("Dropdown", () => {
    it("is closed by default", () => {
      render(<Legend {...props} ranges={[rangeMock]} />);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it("does not render if there are no ranges", () => {
      render(<Legend {...props} />);
      const button = screen.getByText(/show map legend/i);
      fireEvent.click(button);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it("does not render if the legend is not open", () => {
      render(<Legend {...props} ranges={[rangeMock]} />);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it("renders if there are ranges and the legend is open", () => {
      render(<Legend {...props} ranges={[rangeMock]} />);
      const button = screen.getByText(/show map legend/i);
      fireEvent.click(button);
      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it("renders a swatch for each range", () => {
      const ranges: Range[] = [
        { color: "#c00", min: 0, max: 10 },
        { color: "#0c0", min: 10, max: 20 },
        { color: "#00c", min: 20, max: 30 },
      ];
      render(<Legend {...props} ranges={ranges} />);

      const button = screen.getByText(/show map legend/i);
      fireEvent.click(button);

      ranges.forEach((range) => {
        const label = screen.getByText(
          new RegExp(`\\$${range.min} - \\$${range.max}`),
        );
        const swatch = label.previousSibling as HTMLElement;

        expect(swatch).toBeInTheDocument();
        expect(swatch).toHaveStyle(`background-color: ${range.color}`);
      });
    });
  });
});
