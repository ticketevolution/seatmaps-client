export const COLOR_VARIABLES = [
  'emptySectionFill',
  'selectedSectionFill',
  'hoverSectionFill',
]

export const LIGHT_THEME: ColorVariableType = {
  emptySectionFill: '#9E9E9E',
  selectedSectionFill: '#F06449',
  hoverSectionFill: '#3D5A80',
}

export const DARK_THEME: ColorVariableType = {
  emptySectionFill: '#9E9E9E',
  selectedSectionFill: '#F06449',
  hoverSectionFill: '#81A4CD',
}

export function getSectionColor(lowestSectionPrice) {
  const { sectionPercentiles } = this.props;
  const { lowerPriceBound, upperPriceBound } = this.state;
  const percentile = (lowestSectionPrice - lowerPriceBound) / (upperPriceBound - lowerPriceBound);
  const sectionPercentileKeys = Object.keys(sectionPercentiles).map(key => +key).sort();
  for (const key of sectionPercentileKeys) {
    if (percentile <= key) {
      return sectionPercentiles[key];
    }
  }
}