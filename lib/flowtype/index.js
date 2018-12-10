/* eslint-disable */
declare var module: {
  hot: {
    accept(path?: string, callback?: () => void): void,
  },
}

type TicketGroupType = {
  sectionId: number,
  ticketType: string,
  price: number,
  zoneId: string,
}

type ColorVariableType = {
  emptySectionFill: string,
  selectedSectionFill: string,
  hoverSectionFill: string,
}
