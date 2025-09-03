import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Tooltip, { formatCurrency } from "../../Tooltip/index";
import { describe, expect, it } from "@jest/globals";

describe("Tooltip", () => {
  it("renders", () => {
    const { container } = render(<Tooltip />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders a transparent element when isActive is false", () => {
    render(<Tooltip isActive={false} />);
    const tooltip = screen.getByTestId("seatmaps-tooltip");
    expect(tooltip).toHaveStyle("opacity: 0");
  });

  it("renders an opaque element when isActive is true", () => {
    render(<Tooltip isActive />);
    const tooltip = screen.getByTestId("seatmaps-tooltip");
    expect(tooltip).toHaveStyle("opacity: 1");
  });

  it("renders name", () => {
    render(<Tooltip name="example-name" />);
    expect(screen.getByText("example-name")).toBeInTheDocument();
  });

  it("renders the ticket group price", () => {
    render(<Tooltip ticketGroups={[{ section: "", price: 123.45 }]} />);
    expect(screen.getByText(formatCurrency(123.45))).toBeInTheDocument();
  });

  it("renders the lowest ticket group price (lowest first)", () => {
    render(
      <Tooltip
        ticketGroups={[
          { section: "", price: 123.45 },
          { section: "", price: 678.9 },
        ]}
      />,
    );
    expect(screen.getByText(formatCurrency(123.45))).toBeInTheDocument();
    expect(screen.queryByText(formatCurrency(678.9))).not.toBeInTheDocument();
  });

  it("renders the lowest ticket group price (lowest not first)", () => {
    render(
      <Tooltip
        ticketGroups={[
          { section: "", price: 678.9 },
          { section: "", price: 123.45 },
        ]}
      />,
    );
    expect(screen.getByText(formatCurrency(123.45))).toBeInTheDocument();
    expect(screen.queryByText(formatCurrency(678.9))).not.toBeInTheDocument();
  });
});
