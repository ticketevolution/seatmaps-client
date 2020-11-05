import { getReferencePoint, getScreenCTM, getViewBox } from "../../utils/utils";

const svg = {
  createSVGPoint: jest.fn(),
  getScreenCTM: jest.fn(),
  viewBox: {
    baseVal: 100,
  },
};

describe(getReferencePoint, () => {
  const svgMock = (svg as any) as SVGSVGElement;

  it("should call createSvgPoint function", () => {
    getReferencePoint(svgMock);
    expect(svgMock.createSVGPoint).toHaveBeenCalledTimes(1);
  });
});

describe(getScreenCTM, () => {
  const svgMock = (svg as any) as SVGSVGElement;

  it("should call getScreenCTM function", () => {
    getScreenCTM(svgMock);
    expect(svgMock.getScreenCTM).toHaveBeenCalledTimes(1);
  });
});

describe(getViewBox, () => {
  const svgMock = (svg as any) as SVGSVGElement;

  it("should call getViewBox function", () => {
    expect(getViewBox(svgMock)).toBe(svgMock.viewBox.baseVal);
  });
});
