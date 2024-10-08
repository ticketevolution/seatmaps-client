import { createRoot } from "react-dom/client";
import { TicketMap } from "@aisaac-lab/seatmaps-client";
import ticketGroups from "@-/mock-data/data/ticket-groups-1591449.json";

const rootEl = document.getElementById("map");
if (!rootEl) {
  throw new Error("no root element in html");
}

const root = createRoot(rootEl);

root.render(
  <TicketMap
    venueId="896"
    configurationId="14341"
    ticketGroups={ticketGroups}
  />,
);
