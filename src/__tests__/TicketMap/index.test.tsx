import React from "react";
import { mount, ReactWrapper, shallow, ShallowWrapper } from "enzyme";

const getReferencePointMock = jest.fn();
const getScreenCTMMock = jest.fn();
const getViewBoxMock = jest.fn();

const mockPoint = {
  x: 0,
  y: 0,
  w: 0,
  z: 0,
  toJSON: jest.fn(),
  matrixTransform: () => {
    return mockPoint;
  },
};

const initializeZoomMock = jest.fn();
const actualZoom = jest.requireActual("../../utils/zoom");

jest.mock("../../utils/zoom", () => ({
  __esModule: true,
  ...actualZoom,
  default: initializeZoomMock,
}));

initializeZoomMock.mockImplementation(actualZoom.default);

jest.mock("../../utils/utils", () => ({
  ...jest.requireActual("../../utils/utils"),
  getReferencePoint: getReferencePointMock,
  getScreenCTM: getScreenCTMMock,
  getViewBox: getViewBoxMock,
}));

getReferencePointMock.mockReturnValue(mockPoint);
getScreenCTMMock.mockReturnValue(mockPoint);
getViewBoxMock.mockReturnValue(mockPoint);

import TicketMap from "../../TicketMap/index";
import { State, Props, Manifest } from "../../types/TicketMap";
import Tooltip from "../../Tooltip";
import Actions from "../../Actions";
import { TicketGroup } from "../../types/TicketGroups";
import ZoomHelper from "../../ZoomHelper";

const createTouchEvent = (target: HTMLElement, pageX = 0, pageY = 0) => ({
  target,
  changedTouches: {
    length: 1,
    item: () => ({
      pageX,
      pageY,
    }),
  },
});

describe("TicketMap", () => {
  let wrapper: ReactWrapper<Props, State, TicketMap>;
  let comp: ShallowWrapper<Props, State, TicketMap>;
  let props: Props;
  let manifestResponse: [string, { status: number }];
  let mapResponse: [string, { status: number }];
  let mapRoot: HTMLDivElement;
  let manifest: Manifest;
  let ticketGroup: TicketGroup;
  let fillSectionSpy: jest.SpyInstance;

  const mountComponent = (responses = [mapResponse, manifestResponse]) => {
    fetchMock.mockResponses(...responses);
    wrapper = mount(<TicketMap {...props} />);
    fillSectionSpy = jest.spyOn(wrapper.instance(), "fillSection");
    return new Promise(setImmediate);
  };

  const shallowComponent = (responses = [mapResponse, manifestResponse]) => {
    fetchMock.mockResponses(...responses);
    comp = shallow(<TicketMap {...props} />);
    fillSectionSpy = jest.spyOn(comp.instance(), "fillSection");
    return new Promise(setImmediate);
  };

  beforeEach(() => {
    ticketGroup = {
      tevo_section_name: "Foo Bar",
      retail_price: 10,
    };
    mapRoot = document.createElement("div");
    manifest = {
      sections: {
        "foo bar": {
          zone_name: "",
        },
      },
    };
    mapResponse = [
      '<svg><path data-section-id="foo bar" /><text>Foo Bar</text></svg>',
      { status: 200 },
    ];
    manifestResponse = [JSON.stringify(manifest), { status: 200 }];
    props = {
      venueId: "1",
      configurationId: "2",
    };
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("fetches the map associated with the venue and config IDs", async () => {
    await mountComponent();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://maps.ticketevolution.com/1/2/map.svg"
    );
  });

  it("renders a not found image if the map fetch fails", async () => {
    jest.spyOn(global.console, "error").mockImplementationOnce(() => {});
    await mountComponent([[mapResponse[0], { status: 404 }]]);
    wrapper.update();
    expect(wrapper).toHaveState("mapNotFound", true);
    expect(wrapper.find("img")).toHaveLength(1);
    expect(wrapper).toIncludeText("Seating chart not available.");
  });

  it("when error is different than mapNotFound ", async () => {
    jest.spyOn(global.console, "error").mockImplementationOnce(() => {});
    await mountComponent([
      [mapResponse[0], { status: 200 }],
      [manifestResponse[0], { status: 400 }],
    ]);
    wrapper.update();
    expect(wrapper).toHaveState("mapNotFound", false);
  });

  it("fetches the manifest associated with the venue and config IDs", async () => {
    await mountComponent();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://maps.ticketevolution.com/1/2/manifest.json"
    );
  });

  it("renders a tooltip", async () => {
    await mountComponent();
    expect(wrapper.find(Tooltip)).toExist();
  });

  it("renders an Action menu", async () => {
    await mountComponent();
    wrapper.update();
    expect(wrapper.find(Actions)).toExist();
  });

  it("ignores falsey selected sections", async () => {
    props.selectedSections = ["foo", , null, undefined] as string[]; // eslint-disable-line no-sparse-arrays
    await mountComponent();
    expect(wrapper.state("selectedSections").size).toBe(1);
    expect(wrapper.state("selectedSections").has("foo")).toBeTruthy();
  });

  describe("when hovering over a section", () => {
    let target: HTMLElement;

    beforeEach(async () => {
      target = document.createElement("path");
      target.setAttribute("data-section-id", "foo bar");
      props.ticketGroups = [ticketGroup];
      await mountComponent();
      fillSectionSpy.mockClear();
    });

    it("highlights the section", () => {
      wrapper.simulate("mouseover", { clientX: 10, clientY: 10, target });
      expect(fillSectionSpy).toHaveBeenCalledTimes(1);
      expect(fillSectionSpy).toHaveBeenCalledWith("foo bar", true);
    });

    it("does not highlight if the event target does not have a section ID", () => {
      target.removeAttribute("data-section-id");
      wrapper.simulate("mouseover", { clientX: 10, clientY: 10, target });
      expect(fillSectionSpy).not.toHaveBeenCalled();
    });

    it("does not highlight if the section is not in the manifest", () => {
      target.setAttribute("data-section-id", "biz baz");
      wrapper.simulate("mouseover", { clientX: 10, clientY: 10, target });
      expect(fillSectionSpy).not.toHaveBeenCalled();
    });

    it("updates the tooltip", () => {
      wrapper.simulate("mouseover", { clientX: 10, clientY: 10, target });
      expect(wrapper).toHaveState({
        tooltipActive: true,
        tooltipX: 10,
        tooltipY: 10,
        tooltipSectionName: "foo bar",
        currentHoveredSection: "foo bar",
      });
    });

    it("tooltip should be placed at 0;0 and inactive by default", () => {
      wrapper.instance().doHover(target);

      expect(wrapper).toHaveState({
        tooltipActive: false,
        tooltipX: 0,
        tooltipY: 0,
        tooltipSectionName: "foo bar",
        currentHoveredSection: "foo bar",
      });
    });
  });

  describe("when hovering off a section", () => {
    let relatedTarget: HTMLElement;

    beforeEach(async () => {
      relatedTarget = document.createElement("path");
      relatedTarget.setAttribute("data-section-id", "biz baz");

      props.ticketGroups = [ticketGroup];
      await mountComponent();
      wrapper.setState({
        currentHoveredSection: "foo bar",
        tooltipActive: true,
      });
      fillSectionSpy.mockClear();
    });

    it("removes the tooltip and clears the hovering section", () => {
      wrapper.simulate("mouseout", { relatedTarget });
      expect(wrapper).toHaveState({
        tooltipActive: false,
        currentHoveredSection: undefined,
      });
    });

    it("does not clear the hovering section if the entering element is a text node", () => {
      relatedTarget = document.createElement("text");
      wrapper.simulate("mouseout", { relatedTarget });
      expect(wrapper).not.toHaveState({
        tooltipActive: false,
        currentHoveredSection: undefined,
      });
    });

    it("does not clear the hovering section if the entering section is the currently hovered section", () => {
      relatedTarget.setAttribute("data-section-id", "foo bar");
      wrapper.simulate("mouseout", { relatedTarget });
      expect(wrapper).not.toHaveState({
        tooltipActive: false,
        currentHoveredSection: undefined,
      });
    });
  });

  describe("when mousing over the map", () => {
    beforeEach(() => mountComponent());

    it("updates the location of the tooltip", () => {
      expect(wrapper).not.toHaveState({
        tooltipX: 30,
        tooltipY: 30,
      });
      wrapper.simulate("mousemove", {
        nativeEvent: {
          clientX: 30,
          clientY: 30,
        },
      });
      expect(wrapper).toHaveState({
        tooltipX: 30,
        tooltipY: 30,
      });
    });
  });

  describe("when clicking on a section", () => {
    beforeEach(async () => {
      props.ticketGroups = [ticketGroup];
      await mountComponent();
      wrapper.setState({ currentHoveredSection: "foo bar" });
    });

    it("toggles the section in the selectedSections", () => {
      wrapper.simulate("click");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
      wrapper.simulate("click");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();
    });

    it("does not toggle the section in the selectedSections set if the section has no ticket groups", () => {
      wrapper.instance().updateTicketGroups([]);
      wrapper.simulate("click");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();

      wrapper.setState({ selectedSections: new Set(["foo bar"]) });
      wrapper.simulate("click");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
    });

    it("does not toggle the section in the selectedSections set if not currently hovering over the section", () => {
      wrapper.setState({ currentHoveredSection: undefined });
      wrapper.simulate("click");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();

      wrapper.setState({ selectedSections: new Set(["foo bar"]) });
      wrapper.simulate("click");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
    });
  });

  describe("when touching a section on mobile", () => {
    let target: HTMLElement;

    beforeEach(async () => {
      target = document.createElement("path");
      target.setAttribute("data-section-id", "foo bar");
      props.ticketGroups = [ticketGroup];
      await mountComponent();
      wrapper.setState({ currentHoveredSection: "foo bar" });
    });

    it("toggles the section in the selectedSections set", () => {
      wrapper.simulate("touchstart", createTouchEvent(target));
      wrapper.simulate("click");
      wrapper.simulate("touchend", createTouchEvent(target));
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
      wrapper.simulate("touchstart", createTouchEvent(target));
      wrapper.simulate("click");
      wrapper.simulate("touchend", createTouchEvent(target));
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();
    });

    it("does not toggle the section in the selectedSections set if the section has no ticket groups", () => {
      wrapper.instance().updateTicketGroups([]);
      wrapper.simulate("touchstart", createTouchEvent(target));
      wrapper.simulate("click");
      wrapper.simulate("touchend", createTouchEvent(target));
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();

      wrapper.setState({ selectedSections: new Set(["foo bar"]) });
      wrapper.simulate("touchstart", createTouchEvent(target));
      wrapper.simulate("click");
      wrapper.simulate("touchend", createTouchEvent(target));
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
    });

    it("does not toggle the section if currently dragging the map", () => {
      wrapper.simulate("touchstart", createTouchEvent(target));
      wrapper.simulate("touchmove", createTouchEvent(target));
      wrapper.simulate("touchend", createTouchEvent(target));
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();
    });

    it("toggles the section if a touch event drags a small amount", () => {
      wrapper.simulate("touchstart", createTouchEvent(target));
      wrapper.simulate("click");
      wrapper.simulate("touchend", createTouchEvent(target, 1, 1));
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
    });
  });

  describe("updateTicketGroups", () => {
    beforeEach(() => mountComponent());

    it("updates the internal state of ticket groups", () => {
      expect(wrapper.state("ticketGroups")).not.toContain(ticketGroup);
      wrapper.instance().updateTicketGroups([ticketGroup]);
      expect(wrapper.state("ticketGroups")).toContain(ticketGroup);
    });

    it("should log warning with missing section ids", () => {
      const warnMock = jest.spyOn(console, "warn");
      wrapper.instance().updateTicketGroups([
        {
          tevo_section_name: "fake section",
          retail_price: 10,
        },
      ]);
      expect(
        warnMock
      ).toHaveBeenCalledWith(
        "Unknown section names found in ticket groups: %o",
        ["fake section"]
      );
    });

    it("should use props ticket groups as default", async () => {
      props.ticketGroups = [ticketGroup];
      await mountComponent();
      jest.spyOn(wrapper.instance(), "setState");

      wrapper.instance().updateTicketGroups();

      expect(wrapper.instance().setState).toHaveBeenCalledWith({
        ticketGroups: props.ticketGroups,
      });
    });
  });

  describe("highlightSection", () => {
    beforeEach(() => mountComponent());

    it("colors the given section on the map", () => {
      wrapper.instance().highlightSection("Foo Bar");
      expect(fillSectionSpy).toHaveBeenCalledWith("foo bar", true);
    });
  });

  describe("unhighlightSection", () => {
    beforeEach(async () => {
      props.ticketGroups = [ticketGroup];
      await mountComponent();
      wrapper.setState({ currentHoveredSection: "foo bar" });
      fillSectionSpy.mockClear();
    });

    it("removes the color for the given section on the map", () => {
      wrapper.instance().unhighlightSection("Foo Bar");
      expect(fillSectionSpy).toHaveBeenCalledWith("foo bar", false);
    });

    it("does not remove the color for the given section on the map if the section is selected", () => {
      wrapper.setState({ selectedSections: new Set(["foo bar"]) });
      fillSectionSpy.mockClear();
      wrapper.instance().unhighlightSection("Foo Bar");
      expect(fillSectionSpy).not.toHaveBeenCalled();
    });

    it("clears the currently hovered section if no section is provided", () => {
      wrapper.instance().unhighlightSection();
      expect(wrapper).toHaveState("currentHoveredSection", undefined);
    });
  });

  describe("selectSection", () => {
    beforeEach(() => mountComponent());

    it("adds the section in the selectedSections set", () => {
      wrapper.instance().updateTicketGroups([ticketGroup]);
      wrapper.instance().selectSection("Foo Bar");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
    });

    it("does not add the section to the selectedSections set if the section has no ticket groups", () => {
      wrapper.instance().selectSection("Foo Bar");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();
    });
  });

  describe("deselectSection", () => {
    beforeEach(() => {
      props.selectedSections = ["foo bar"];
      props.ticketGroups = [ticketGroup];
      return mountComponent();
    });

    it("removes the section from the selectedSections set", () => {
      wrapper.instance().deselectSection("Foo Bar");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeFalsy();
    });

    it("does not remove the section from the selectedSections set if the section has no ticket groups", () => {
      wrapper.instance().updateTicketGroups([]);
      wrapper.instance().deselectSection("Foo Bar");
      expect(wrapper.state("selectedSections").has("foo bar")).toBeTruthy();
    });

    it("clears all sections if no section is specified", () => {
      wrapper.instance().deselectSection();
      expect(wrapper.state("selectedSections").size).toBe(0);
    });
  });

  describe("render()", () => {
    it("should allow pointer events when mouseControlEnabled is true", async () => {
      await mountComponent();
      wrapper.setProps({ mouseControlEnabled: true });
      expect(wrapper.find("div").first()).toHaveStyle(
        "pointerEvents",
        "initial"
      );
    });

    it("should allow pointer events when mouseControlEnabled is false", async () => {
      await mountComponent();
      wrapper.setProps({ mouseControlEnabled: false });
      expect(wrapper.find("div").first()).toHaveStyle("pointerEvents", "none");
    });

    it("should enable zoom when mouseControlEnabled is changed to true", async () => {
      const enableMock = jest.fn();
      initializeZoomMock.mockReturnValue({
        enable: enableMock,
        disable: jest.fn(),
      });
      await mountComponent();
      wrapper.setProps({ mouseControlEnabled: false });
      wrapper.update();
      wrapper.setProps({ mouseControlEnabled: true });
      wrapper.update();
      expect(enableMock).toHaveBeenCalled();
    });

    it("should not initialize zoom when mouseControlEnabled is false", async () => {
      props.mouseControlEnabled = false;

      await mountComponent();

      expect(initializeZoomMock).not.toHaveBeenCalled();
    });
  });

  describe("componentWillUnmount", () => {
    const tearDownMock = jest.fn();
    beforeAll(() => {
      initializeZoomMock.mockReturnValue({
        teardown: tearDownMock,
      });
    });

    describe("when zoom is enabled", () => {
      it("tears down zoom", async () => {
        await mountComponent();
        wrapper.unmount();
        expect(tearDownMock).toHaveBeenCalledTimes(1);
      });
    });

    describe("when zoom is not enabled", () => {
      beforeAll(() => {
        initializeZoomMock.mockReturnValue(undefined);
      });

      it("tears down zoom", async () => {
        await mountComponent();
        wrapper.unmount();
        expect(tearDownMock).not.toHaveBeenCalled();
      });
    });
  });

  describe("on mobile devices", () => {
    it("should render zoom helper", async () => {
      await shallowComponent();
      comp.instance().setState({ isTouchDevice: true });
      comp.update();

      expect(comp.find(ZoomHelper)).toExist();
    });
  });

  describe("setup", () => {
    it("should not set map in state if dom element is not found", async () => {
      await mountComponent();
      const getMapRootElementMock = jest.spyOn(
        wrapper.instance(),
        "getMapRootElement"
      );
      getMapRootElementMock.mockReturnValue(undefined as any);
      jest.spyOn(wrapper.instance(), "setState");
      wrapper.update();
      wrapper.instance().setupMap();

      expect(wrapper.instance().setState).not.toHaveBeenCalledWith({
        mapSvg: expect.anything(),
      });
    });

    it("should not set map in state if no svg element found", async () => {
      await mountComponent();
      const getMapRootElementMock = jest.spyOn(
        wrapper.instance(),
        "getMapRootElement"
      );

      const querySelectorMock = jest.fn();
      querySelectorMock.mockReturnValue(undefined);

      getMapRootElementMock.mockReturnValue({
        querySelector: querySelectorMock,
      } as any);
      jest.spyOn(wrapper.instance(), "setState");
      wrapper.update();
      wrapper.instance().setupMap();

      expect(wrapper.instance().setState).not.toHaveBeenCalledWith({
        mapSvg: expect.anything(),
      });
    });

    it("when section has no section id attribute should not be set", async () => {
      const mapResponseNoSectionId: [string, { status: number }] = [
        "<svg><path data-section-id /></svg>",
        { status: 200 },
      ];
      await mountComponent([mapResponseNoSectionId, manifestResponse]);

      wrapper.instance().setupMap();

      const section = wrapper.instance().getMapRootElement();
      expect(section!.querySelector("path")).toBeDefined();
      expect(section!.getAttribute("data-section-id")).toBe(null);
    });
  });

  describe("getAllPath", () => {
    it("should return empty array if map element not found", async () => {
      await mountComponent();
      const getMapRootElementMock = jest.spyOn(
        wrapper.instance(),
        "getMapRootElement"
      );
      getMapRootElementMock.mockReturnValue(undefined as any);
      wrapper.update();

      const result = wrapper.instance().getAllPaths();

      expect(result).toStrictEqual([]);
    });

    it("should concat all path elements", async () => {
      const mapResponseNoSectionId: [string, { status: number }] = [
        '<svg><path id="p1" data-section-id="1"><path id="p2"/><path id="p3"/></path><path id="p4" data-section-id="4"/></svg>',
        { status: 200 },
      ];
      await mountComponent([mapResponseNoSectionId, manifestResponse]);

      const result = wrapper.instance().getAllPaths();

      const section = wrapper.instance().getMapRootElement();
      expect(result).toStrictEqual([
        section!.querySelector("#p2"),
        section!.querySelector("#p3"),
        section!.querySelector("#p4"),
      ]);
    });
  });

  describe("toggleSectionHighlight", () => {
    it("should not call fill section if section is undefined", async () => {
      await mountComponent();

      wrapper.instance().toggleSectionHighlight();

      expect(fillSectionSpy).not.toHaveBeenCalled();
    });
  });

  describe("toggleSectionSelect", () => {
    it("should not call fill section if section is undefined", async () => {
      await mountComponent();

      wrapper.instance().toggleSectionSelect(undefined as any);

      expect(fillSectionSpy).not.toHaveBeenCalled();
    });
  });

  describe("fillSection", () => {
    it("should highlight by default", async () => {
      const mapResponseNoSectionId: [string, { status: number }] = [
        '<svg><path id="p1" data-section-id="1"><path id="p2"/></path><path id="p3" data-section-id="4"/></svg>',
        { status: 200 },
      ];
      await mountComponent([mapResponseNoSectionId, manifestResponse]);

      wrapper.instance().fillSection("1");

      const section = wrapper.instance().getMapRootElement();
      expect(section!.querySelector("#p2")!.getAttribute("opacity")).toBe("1");
      expect(section!.querySelector("#p3")!.getAttribute("opacity")).toBe("1");
    });
  });

  describe("getSectionFromTarget", () => {
    let target: HTMLElement;

    it("returns undefined if section has empty id", async () => {
      target = document.createElement("path");
      target.setAttribute("data-section-id", "");

      expect(wrapper.instance().getSectionFromTarget(target)).toBeUndefined();
    });

    it("returns undefined if passed target is undefined", async () => {
      expect(
        wrapper.instance().getSectionFromTarget(null as any)
      ).toBeUndefined();
    });
  });

  describe("getDefaultColor", () => {
    it("should return last range color", async () => {
      props.ticketGroups = [
        { retail_price: 10, tevo_section_name: "tkt-1" },
        { retail_price: 100, tevo_section_name: "tkt-1" },
      ];

      await mountComponent();

      const result = wrapper.instance().getDefaultColor([
        { price: 10, section: "tkt-1" },
        { price: 100, section: "tkt-1" },
      ]);

      expect(result).toBe(wrapper.props().sectionPercentiles!["0.6"]);
    });
  });

  describe("zoom events", () => {
    it("handleZoomIn should call zoom in", async () => {
      const zoomInMock = jest.fn();
      initializeZoomMock.mockReturnValue({
        zoomIn: zoomInMock,
      });

      await mountComponent();

      wrapper.instance().handleZoomIn();

      expect(zoomInMock).toHaveBeenCalledWith(0.1);
    });

    it("handleZoomIn should not fail if zoom is not initialized", async () => {
      initializeZoomMock.mockReturnValue(undefined);

      await mountComponent();

      expect(() => {
        wrapper.instance().handleZoomIn();
      }).not.toThrow();
    });

    it("handleZoomOut should call zoom out", async () => {
      const zoomOutMock = jest.fn();
      initializeZoomMock.mockReturnValue({
        zoomOut: zoomOutMock,
      });

      await mountComponent();

      wrapper.instance().handleZoomOut();

      expect(zoomOutMock).toHaveBeenCalledWith(0.1);
    });

    it("handleZoomOut should not fail if zoom is not initialized", async () => {
      initializeZoomMock.mockReturnValue(undefined);

      await mountComponent();

      expect(() => {
        wrapper.instance().handleZoomOut();
      }).not.toThrow();
    });

    it("handleResetZoom should call zoom in", async () => {
      const resetMock = jest.fn();
      initializeZoomMock.mockReturnValue({
        reset: resetMock,
      });

      await mountComponent();

      wrapper.instance().handleResetZoom();

      expect(resetMock).toHaveBeenCalled();
    });

    it("handleResetZoom should not fail if zoom is not initialized", async () => {
      initializeZoomMock.mockReturnValue(undefined);

      await mountComponent();

      expect(() => {
        wrapper.instance().handleResetZoom();
      }).not.toThrow();
    });
  });
});
