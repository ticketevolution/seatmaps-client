/* eslint-disable */
declare var module: {
  hot: {
    accept(path?: string, callback?: () => void): void,
  },
}

type TicketBlockType = {
  sectionId: number,
  ticketType: string,
  price: number,
  zoneId: string,
}

type ColorVariableType = {
  emptySectionFill: string,
  primarySectionFill: string,
  cheapSectionFill: string,
  expensiveSectionFill: string,
  selectedSectionFill: string,
  hoverSectionFill: string,
}
