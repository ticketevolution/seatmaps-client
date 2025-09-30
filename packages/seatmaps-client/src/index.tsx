import pick from "lodash.pick";
import union from "lodash.union";
import React from "react";
import { createRoot, Root } from "react-dom/client";
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
  "showLegendOpenAlwaysForDesktop",
  "showLegend",
  "openLegendInitially",
  "mouseControlEnabled",
  "showZoomHelper",
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
  private root?: Root;

  constructor(options: Props) {
    validateOptions(options);
    this.configuration = extractConfigurationFromOptions(options);
  }

  build(rootElementId: string): Promise<PublicApi | undefined> {
    if (!rootElementId) {
      throw new Error("Seatmaps must be initialized with a DOM element.");
    }

    const rootElement = document.getElementById(rootElementId);
    if (!rootElement) {
      throw new Error("Seatmaps must be initialized with a DOM element.");
    }

    return new Promise((resolve) => {
      this.root = createRoot(rootElement);
      this.root.render(
        <TicketMap
          {...this.configuration}
          ref={(ref: TicketMap) => {
            resolve(ref?.publicApi);
          }}
        />,
      );
    });
  }
}

export { TicketMap };
