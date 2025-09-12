import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Actions, { Props } from "../../Actions";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

describe("Actions", () => {
  let props: Props;

  beforeEach(() => {
    props = {
      ranges: [],
      onClearSelection: jest.fn(),
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onResetZoom: jest.fn(),
    };
  });

  it("renders", () => {
    render(<Actions {...props} />);
    expect(screen.getByTestId("seatmaps-actions-menu")).toBeInTheDocument();
  });

  it("renders the actions and legend in one group on mobile", async () => {
    render(<Actions {...props} showControls showLegend />);

    await waitFor(() => {
      const groups = screen.getByTestId("seatmaps-actions-menu").children;
      expect(groups).toHaveLength(1);
    });
    expect(screen.getByText(/show map legend/i)).toBeInTheDocument();
  });

  it("renders the actions and legend in separate groups on desktop", () => {
    render(<Actions {...props} showControls showLegend />);
    const groups = screen.getByTestId("seatmaps-actions-menu").children;
    expect(groups).toHaveLength(2);
    expect(screen.getByText(/show map legend/i)).toBeInTheDocument();
  });

  describe("when controls are visible", () => {
    it("renders all control buttons on desktop", () => {
      render(<Actions {...props} showControls />);
      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
      expect(screen.getByTestId("zoom-in")).toBeInTheDocument();
      expect(screen.getByTestId("zoom-out")).toBeInTheDocument();
      expect(screen.getByTestId("reset-zoom")).toBeInTheDocument();
    });

    it("buttons call correct handlers on desktop", () => {
      render(<Actions {...props} showControls />);

      fireEvent.click(screen.getByText(/clear all/i));
      fireEvent.click(screen.getByTestId("zoom-in"));
      fireEvent.click(screen.getByTestId("zoom-out"));
      fireEvent.click(screen.getByTestId("reset-zoom"));

      expect(props.onClearSelection).toHaveBeenCalled();
      expect(props.onZoomIn).toHaveBeenCalled();
      expect(props.onZoomOut).toHaveBeenCalled();
      expect(props.onResetZoom).toHaveBeenCalled();
    });

    it("renders limited controls on mobile", () => {
      render(<Actions {...props} showControls />);
      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /zoom in/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /zoom out/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /reset zoom/i }),
      ).not.toBeInTheDocument();
    });

    it("clears interval on unmount", () => {
      const clearSpy = jest.spyOn(window, "clearInterval");
      const { unmount } = render(<Actions {...props} showControls />);
      unmount();
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe("responsive behavior (updateIsMobile)", () => {
    it("treats small container as mobile", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: 399,
      });

      render(<Actions {...props} showControls />);
      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /zoom in/i }),
      ).not.toBeInTheDocument();
    });

    it("treats narrow window as mobile", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: 500,
      });

      render(<Actions {...props} showControls />);
      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
    });
  });
});
