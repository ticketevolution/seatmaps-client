if (typeof SVGSVGElement.prototype.viewBox === "undefined") {
  Object.defineProperty(SVGSVGElement.prototype, "viewBox", {
    get: function () {
      const rect: SVGAnimatedRect = {
        animVal: {
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({ x: 0, y: 0, width: 0, height: 0 }),
        },
        baseVal: {
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({ x: 0, y: 0, width: 0, height: 0 }),
        },
      };
      return rect;
    },
  });
}

if (typeof SVGSVGElement.prototype.createSVGPoint === "undefined") {
  SVGSVGElement.prototype.createSVGPoint = function (): DOMPoint {
    const mockPoint: DOMPoint = {
      w: 0,
      x: 0,
      y: 0,
      z: 0,
      matrixTransform: (matrix?: DOMMatrixInit): DOMPoint => {
        if (!matrix) {
          return mockPoint;
        }

        if (
          matrix.is2D ||
          (matrix.m13 === undefined &&
            matrix.m14 === undefined &&
            matrix.m23 === undefined &&
            matrix.m24 === undefined &&
            matrix.m31 === undefined &&
            matrix.m32 === undefined &&
            matrix.m34 === undefined &&
            matrix.m43 === undefined)
        ) {
          return {
            w: 1,
            x:
              (matrix.a || matrix.m11 || 1) * mockPoint.x +
              (matrix.c || matrix.m21 || 0) * mockPoint.y +
              (matrix.e || matrix.m41 || 0),
            y:
              (matrix.b || matrix.m12 || 0) * mockPoint.x +
              (matrix.d || matrix.m22 || 1) * mockPoint.y +
              (matrix.f || matrix.m42 || 0),
            z: 0,
            matrixTransform: mockPoint.matrixTransform,
            toJSON: mockPoint.toJSON,
          };
        } else {
          // For 3D matrix transform
          return {
            w: 1,
            x:
              (matrix.m11 || 1) * mockPoint.x +
              (matrix.m21 || 0) * mockPoint.y +
              (matrix.m31 || 0) * mockPoint.z +
              (matrix.m41 || 0),
            y:
              (matrix.m12 || 0) * mockPoint.x +
              (matrix.m22 || 1) * mockPoint.y +
              (matrix.m32 || 0) * mockPoint.z +
              (matrix.m42 || 0),
            z:
              (matrix.m13 || 0) * mockPoint.x +
              (matrix.m23 || 0) * mockPoint.y +
              (matrix.m33 || 1) * mockPoint.z +
              (matrix.m43 || 0),
            matrixTransform: mockPoint.matrixTransform,
            toJSON: mockPoint.toJSON,
          };
        }
      },
      toJSON: () => {
        return {
          w: mockPoint.w,
          x: mockPoint.x,
          y: mockPoint.y,
          z: mockPoint.z,
        };
      },
    };
    return mockPoint;
  };
}
