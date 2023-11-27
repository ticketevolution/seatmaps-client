import React, { LegacyRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { rest } from "msw";
import "@testing-library/jest-dom";
import { Props, Manifest } from "../../types/TicketMap";
import { TicketGroup } from "../../types/TicketGroups";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  TicketMap,
  highlightedSectionColor,
  unhighlightedSectionColor,
} from "../../TicketMap";

const manifest: Manifest = {
  sections: {
    "foo bar": {
      zone_name: "",
    },
  },
};

const dataProps: Props = {
  venueId: "1",
  configurationId: "2",
};

const mapSVGTestId = "map-svg-root";

const manifestURL = `https://maps.ticketevolution.com/${dataProps.venueId}/${dataProps.configurationId}/manifest.json`;
const svgURL = `https://maps.ticketevolution.com/${dataProps.venueId}/${dataProps.configurationId}/map.svg`;

const server = setupServer(
  rest.get(manifestURL, (req, res, ctx) => {
    return res(ctx.json(manifest));
  }),
  rest.get(svgURL, (req, res, ctx) => {
    return res(
      ctx.text(
        `<svg data-testid="${mapSVGTestId}">
            <path data-testid="seatmaps-section" data-section-id="foo bar" />
            <path data-testid="seatmaps-section-2" data-section-id="section-id-2" />
            <text>Foo Bar</text>
        </svg>`,
      ),
    );
  }),
);

const ticketGroup: TicketGroup = {
  tevo_section_name: "Foo Bar",
  retail_price: 10,
};

describe("TicketMap", () => {
  beforeAll(() => server.listen());

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  it("renders the svg map associated with the venue and config IDs", async () => {
    await waitFor(() => {
      render(<TicketMap {...dataProps} />);
    });
    expect(await screen.findByTestId(mapSVGTestId)).toBeInTheDocument();
  });

  it("renders a not found image if the map fetch fails", async () => {
    server.use(
      rest.get(svgURL, (req, res, ctx) => {
        return res(ctx.status(404));
      }),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await waitFor(() => {
      render(<TicketMap {...dataProps} />);
    });
    expect(
      await screen.findByText("Seating chart not available."),
    ).toBeInTheDocument();
    expect(
      await screen.findByAltText(
        "Seating chart not available. It was abducted by aliens.",
      ),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("when error is different than mapNotFound do not display anything", async () => {
    server.use(
      rest.get(manifestURL, (req, res, ctx) => {
        return res(ctx.status(400));
      }),
    );
    const consoleError = jest
      .spyOn(global.console, "error")
      .mockImplementationOnce(() => {});
    await waitFor(() => {
      render(<TicketMap {...dataProps} />);
    });
    expect(screen.queryByText("Seating chart not available.")).toBeNull();
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("renders a tooltip", async () => {
    await waitFor(() => {
      render(<TicketMap {...dataProps} />);
    });
    expect(
      await screen.findByText(`0 listings ● Starting at`),
    ).toBeInTheDocument();
  });
  it("renders an Action menu", async () => {
    await waitFor(() => {
      render(<TicketMap {...dataProps} />);
    });
    expect(
      await screen.findByTestId(`seatmaps-actions-menu`),
    ).toBeInTheDocument();
  });

  it("displays section at full opacity when it's selected", async () => {
    await waitFor(() => {
      render(
        <TicketMap
          {...dataProps}
          selectedSections={
            ["foo", "foo-bar", null, undefined] as unknown as string[]
          }
        />,
      );
    });
    expect(await screen.findByTestId(`seatmaps-section`)).toBeInTheDocument();
    expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
      "opacity",
      "1",
    );
  });

  it("displays section at low opacity when it's not selected", async () => {
    await waitFor(() => {
      render(
        <TicketMap
          {...dataProps}
          // NOTE: this react component is non reactive and selectedSections is an initial prop
          selectedSections={["foo", null, undefined] as unknown as string[]}
          // NOTE: selectedSections also do not apply if section is not found ticketGroups or ticketGroups are not passed
          ticketGroups={[ticketGroup]}
        />,
      );
    });
    expect(await screen.findByTestId(`seatmaps-section`)).toBeInTheDocument();
    expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
      "opacity",
      "0.6",
    );
  });

  describe("when hovering over a section", () => {
    beforeEach(async () => {
      await waitFor(() => {
        render(
          <TicketMap
            {...dataProps}
            // NOTE: if ticket groups are not provided hover is disabled
            ticketGroups={[ticketGroup]}
          />,
        );
      });
    });

    it("highlights the section", async () => {
      expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
        "stroke",
        unhighlightedSectionColor,
      );
      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        fireEvent.mouseOver(target, { clientX: 10, clientY: 10, target });
      });
      expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
        "stroke",
        highlightedSectionColor,
      );
    });

    it("does not highlight if the event target does not have a section ID", async () => {
      expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
        "stroke",
        unhighlightedSectionColor,
      );

      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        target.removeAttribute("data-section-id");
        fireEvent.mouseOver(target, { clientX: 10, clientY: 10, target });
      });

      expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
        "stroke",
        unhighlightedSectionColor,
      );
    });

    it("does not highlight if the section is not in the manifest", async () => {
      expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
        "stroke",
        unhighlightedSectionColor,
      );

      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        target.setAttribute("data-section-id", "biz baz");
        fireEvent.mouseOver(target, { clientX: 10, clientY: 10, target });
      });

      expect(await screen.findByTestId(`seatmaps-section`)).toHaveAttribute(
        "stroke",
        unhighlightedSectionColor,
      );
    });

    it("tooltip should be placed at 0;0 and inactive by default", async () => {
      const tooltip = await screen.findByTestId(`seatmaps-tooltip`);
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveStyle("opacity: 0");
      expect(tooltip).toHaveStyle("left: 0");
      expect(tooltip).toHaveStyle("top: 0");
    });

    it("updates the tooltip visibility and position", async () => {
      const tooltip = await screen.findByTestId(`seatmaps-tooltip`);

      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        fireEvent.mouseOver(target, { clientX: 20, clientY: 10, target });
      });

      expect(tooltip).toHaveStyle("opacity: 1");
      expect(tooltip).toHaveStyle("left: 20px");
      expect(tooltip).toHaveStyle("top: 10px");
    });
  });

  describe("when hovering off a section", () => {
    beforeEach(async () => {
      await waitFor(() => {
        render(
          <TicketMap
            {...dataProps}
            // NOTE: if ticket groups are not provided hover is disabled
            ticketGroups={[ticketGroup]}
          />,
        );
      });
      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        fireEvent.mouseOver(target, { clientX: 20, clientY: 10, target });
      });
    });

    it("removes the tooltip and clears the hovering section", async () => {
      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        const relatedTarget = await screen.findByTestId("seatmaps-section-2");
        fireEvent.mouseOut(target, { relatedTarget });
      });
      const tooltip = await screen.findByTestId(`seatmaps-tooltip`);
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveStyle("opacity: 0");
    });

    it("does not clear the hovering section if the entering element is a text node", async () => {
      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        const relatedTarget = await screen.findByText("Foo Bar");
        fireEvent.mouseOut(target, { relatedTarget });
      });
      const tooltip = await screen.findByTestId(`seatmaps-tooltip`);
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveStyle("opacity: 1");
    });

    it("does not clear the hovering section if the entering section is the currently hovered section", async () => {
      const tooltip = await screen.findByTestId(`seatmaps-tooltip`);
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveStyle("opacity: 1");

      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        fireEvent.mouseOut(target, { relatedTarget: target });
      });

      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveStyle("opacity: 1");
    });
  });

  describe("when clicking on a section", () => {
    const handleSelection = jest.fn();

    beforeEach(async () => {
      await waitFor(() => {
        render(
          <TicketMap
            {...dataProps}
            // NOTE: if ticket groups are not provided hover is disabled
            ticketGroups={[ticketGroup]}
            onSelection={handleSelection}
          />,
        );
      });
    });

    afterEach(() => {
      handleSelection.mockReset();
    });

    it("toggles the section in the selectedSections", async () => {
      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        fireEvent.mouseOver(target, { clientX: 20, clientY: 10, target });
        fireEvent.click(target);
      });

      expect(handleSelection).toHaveBeenCalledTimes(1);
      expect(handleSelection).toHaveBeenCalledWith(["foo bar"]);

      handleSelection.mockReset();

      await waitFor(async () => {
        const target = await screen.findByTestId("seatmaps-section");
        fireEvent.click(target);
      });

      expect(handleSelection).toHaveBeenCalledTimes(1);
      expect(handleSelection).toHaveBeenCalledWith([]);
    });
  });

  describe("zoom controls", () => {
    it("should call zoom handlers", async () => {
      const instanceRef: LegacyRef<TicketMap> = {
        current: null,
      };
      await waitFor(() => {
        render(
          <TicketMap
            {...dataProps}
            ref={instanceRef}
            showControls
            ticketGroups={[ticketGroup]}
          />,
        );
      });

      const zoomIn = jest.spyOn(instanceRef.current!.zoom!, "zoomIn");
      const zoomOut = jest.spyOn(instanceRef.current!.zoom!, "zoomOut");
      const resetZoom = jest.spyOn(instanceRef.current!.zoom!, "reset");

      await waitFor(async () => {
        const target = await screen.findByTestId("zoom-in");
        fireEvent.click(target);
      });

      expect(zoomIn).toHaveBeenCalledWith(0.1);

      await waitFor(async () => {
        const target = await screen.findByTestId("zoom-out");
        fireEvent.click(target);
      });

      expect(zoomOut).toHaveBeenCalledWith(0.1);

      await waitFor(async () => {
        const target = await screen.findByTestId("reset-zoom");
        fireEvent.click(target);
      });

      expect(resetZoom).toHaveBeenCalled();
    });
  });
});
