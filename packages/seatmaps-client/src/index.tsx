import pick from "lodash.pick";
import union from "lodash.union";
import React from "react";
import { render } from "react-dom";
import {
  DefaultProps,
  Props,
  PublicApi,
  RequiredProps,
  TicketMap,
} from "./TicketMap";

const requiredConfigKeys: (keyof RequiredProps)[] = [
  "venueId",
  "configurationId",
];

const optionalConfigKeys: (keyof DefaultProps)[] = [
  "mapFontFamily",
  "selectedSections",
  "onSelection",
  "ticketGroups",
  "sectionPercentiles",
  "mapsDomain",
  "showControls",
  "showLegend",
  "mouseControlEnabled",
];

export function extractConfigurationFromOptions(options: Props): Props {
  const keys = union(requiredConfigKeys, optionalConfigKeys);
  return pick(options, keys);
}

export function validateOptions(options: Props) {
  for (const key of requiredConfigKeys) {
    if (!(key in options)) {
      throw new Error(`Seatmap configuration requires a '${key}' value.`);
    }
  }
}

export class SeatmapFactory {
  configuration: Props;

  constructor(options: Props) {
    validateOptions(options);
    this.configuration = extractConfigurationFromOptions(options);
  }

  build(rootElementId: string): PublicApi | undefined {
    if (!rootElementId) {
      throw new Error("Seatmaps must be initialized with a DOM element.");
    }

    const rootElement = document.getElementById(rootElementId);
    if (!rootElement) {
      throw new Error("Seatmaps must be initialized with a DOM element.");
    }

    let map: TicketMap | undefined;

    render(
      <TicketMap
        {...this.configuration}
        ref={(ref: TicketMap) => {
          map = ref;
        }}
      />,
      rootElement,
    );

    return map?.publicApi;
  }
}

export { TicketMap };

export const Tevomaps = SeatmapFactory;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let define: any;

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (root as any).Tevomaps = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  return SeatmapFactory;
});
