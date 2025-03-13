import {
  $missingSectionIds,
  $availableTicketGroups,
  $costRanges,
  $ticketGroupsBySection,
  $venueSections,
} from "../../utils/selectors";
import { State, Props, Percentiles } from "../../types/TicketMap";
import { TicketGroup } from "../../types/TicketGroups";
import { beforeEach, describe, expect, it } from "@jest/globals";

let ticketGroupFooBar: TicketGroup;
let ticketGroupBizBaz: TicketGroup;
let state: State;
let props: Props;

beforeEach(() => {
  ticketGroupFooBar = {
    tevo_section_name: "Foo Bar",
    retail_price: 10,
  };
  ticketGroupBizBaz = {
    tevo_section_name: "Biz Baz",
    retail_price: 20,
  };
  state = {
    sectionMapping: {
      "foo bar": {
        sectionName: "foo bar",
      },
    },
    ticketGroups: [ticketGroupFooBar, ticketGroupBizBaz],
    selectedSections: new Set(),
    tooltipActive: false,
    tooltipSectionName: "",
    tooltipX: 0,
    tooltipY: 0,
    mapNotFound: false,
    touchStarts: {},
    isTouchDevice: false,
    dragging: false,
  };
  props = {
    venueId: "",
    configurationId: "",
    sectionPercentiles: {
      "0.2": "#c00",
      "0.8": "#0c0",
    },
  };
});

describe("$missingSectionIds", () => {
  it("returns the section names of ticket group sections missing from the manifest", () => {
    expect($missingSectionIds(state)).toEqual(["biz baz"]);
  });

  it("does not return section names of ticket groups that exist in the manifest", () => {
    expect($missingSectionIds(state)).not.toContain("foo bar");
  });
});

describe("$availableTicketGroups", () => {
  it("returns normalized ticket groups from the ticket groups in the state", () => {
    expect($availableTicketGroups(state)).toEqual([
      {
        section: "foo bar",
        price: 10,
      },
    ]);
  });

  it("skips ticket groups whose section does not appear in the manifest", () => {
    delete state.sectionMapping["foo bar"];
    expect($availableTicketGroups(state)).toHaveLength(0);
  });
});

describe("$costRanges", () => {
  it("returns an empty collection by default", () => {
    delete props.sectionPercentiles;
    expect($costRanges(state, props)).toHaveLength(0);
  });

  it("returns cost ranges sorted by their percentile", () => {
    props.sectionPercentiles = {
      "0.8": "#0c0",
      "0.2": "#c00",
    };
    expect($costRanges(state, props)[0]).toHaveProperty("percentile", 0.2);
    expect($costRanges(state, props)[1]).toHaveProperty("percentile", 0.8);
  });

  it("calculates the min and max retail price for each cost range", () => {
    const ticketGroupBuzBoz = {
      tevo_section_name: "Buz Boz",
      retail_price: 11,
    };
    state.ticketGroups.push(ticketGroupBuzBoz);
    expect($costRanges(state, props)[0]).toMatchObject({ min: 10, max: 10 });
    expect($costRanges(state, props)[1]).toMatchObject({ min: 11, max: 20 });
  });

  it("sets min and max to 0 if there are no ticket groups in the range", () => {
    (props.sectionPercentiles as Percentiles)["1"] = "#00c";
    state.ticketGroups = [];
    expect($costRanges(state, props)).toMatchObject([]);
  });

  it("adds ticket groups to their associated cost range", () => {
    expect($costRanges(state, props)[0].ticketGroups).toContainEqual(
      ticketGroupFooBar,
    );
    expect($costRanges(state, props)[1].ticketGroups).toContainEqual(
      ticketGroupBizBaz,
    );
  });
});

describe("$ticketGroupsBySection", () => {
  it("returns an object of normalized ticket groups keyed off their section", () => {
    expect($ticketGroupsBySection(state)).toMatchObject({
      "foo bar": [
        {
          price: 10,
          section: "foo bar",
        },
      ],
    });
  });

  it("does not add ticket groups which do not appear in the manifest", () => {
    expect($ticketGroupsBySection(state)).not.toHaveProperty("biz baz");
  });
});

describe("$venueSections", () => {
  it("returns the collection of names for sections that both have ticket groups and appear in the manifest", () => {
    expect($venueSections(state)).toContain("foo bar");
    expect($venueSections(state)).not.toContain("biz baz");
  });
});
