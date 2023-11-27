import "unfetch/polyfill";
import React from "react";
import { render } from "react-dom";
import union from "lodash.union";
import pick from "lodash.pick";
import {
  TicketMap,
  Props,
  RequiredProps,
  DefaultProps,
  PublicApi,
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
