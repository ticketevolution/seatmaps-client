import React from "react";
import { render, screen } from "@testing-library/react";
import Tooltip, { formatCurrency, defaultDirection } from "../../Tooltip/index";
import { describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";

describe("Tooltip", () => {
  describe("render()", () => {
    it("renders", () => {
      const { container } = render(<Tooltip />);
      expect(container.firstChild).not.toBeNull();
    });

    it("renders a transparent element when isActive is false", () => {
      const { container } = render(<Tooltip isActive={false} />);
      expect(container.firstChild).toHaveStyle({ opacity: 0 });
    });

    it("renders an opaque element when isActive is true", () => {
      const { container } = render(<Tooltip isActive />);
      expect(container.firstChild).toHaveStyle({ opacity: 1 });
    });

    it("renders name", () => {
      render(<Tooltip name="example-name" />);
      expect(screen.getByText("example-name")).toBeInTheDocument();
    });

    it("renders the ticket group price", () => {
      render(<Tooltip ticketGroups={[{ section: "", price: 123.45 }]} />);
      expect(screen.getByText(formatCurrency(123.45))).toBeInTheDocument();
    });

    it("renders the lowest ticket group price when the lowest ticket group price is placed first", () => {
      render(
        <Tooltip
          ticketGroups={[
            { section: "", price: 123.45 },
            { section: "", price: 678.9 },
          ]}
        />,
      );
      expect(screen.getByText(formatCurrency(123.45))).toBeInTheDocument();
      expect(screen.queryByText(formatCurrency(678.9))).not.toBeInTheDocument();
    });

    it("renders the lowest ticket group price when the lowest ticket group price is not placed first", () => {
      render(
        <Tooltip
          ticketGroups={[
            { section: "", price: 678.9 },
            { section: "", price: 123.45 },
          ]}
        />,
      );
      expect(screen.getByText(formatCurrency(123.45))).toBeInTheDocument();
      expect(screen.queryByText(formatCurrency(678.9))).not.toBeInTheDocument();
    });
  });

  describe("direction()", () => {
    it("returns the default direction when the container html element is not mounted", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = { current: null };
      expect(ref.current.direction()).toEqual(defaultDirection);
    });

    it("returns the default direction when rendered outside of an html element", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        current: { parentElement: null } as any,
      };

      expect(ref.current.direction()).toEqual(defaultDirection);
    });

    it("returns left when the right side of the container is clipped and the tooltip is at the x origin", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} x={0} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        current: {
          clientWidth: 10,
          parentElement: { clientWidth: 5 },
        },
      } as Tooltip["container"];

      expect(ref.current.direction()[1]).toEqual("left");
    });

    it("returns left when the right side of the container is clipped and the tooltip is not at the x origin", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} x={1} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        current: {
          clientWidth: 5,
          parentElement: { clientWidth: 5 },
        },
      } as Tooltip["container"];

      expect(ref.current.direction()[1]).toEqual("left");
    });

    it("returns down when the top of the container is clipped and the tooltip is at the y origin", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} y={0} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        current: {
          clientHeight: 5,
          parentElement: {},
        },
      } as Tooltip["container"];

      expect(ref.current.direction()[0]).toEqual("down");
    });
  });

  describe("Tooltip - position()", () => {
    it("returns x=x, y=y by default", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} />);
      if (!ref.current) throw new Error("ref not set");

      const pos = ref.current.position();
      expect(pos.x).toEqual(ref.current.props.x);
      expect(pos.y).toEqual(ref.current.props.y);
    });

    it("returns x=(x - containerWidth) when container is available and direction is left", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} x={5} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        current: { clientWidth: 10 },
      } as Tooltip["container"];

      jest
        .spyOn(ref.current as Tooltip, "direction")
        .mockReturnValue(["up", "left"]);

      const pos = (ref.current as Tooltip).position();
      expect(pos.x).toEqual(5 - 10);
    });

    it("returns y=(y - containerHeight) when container is available and direction is up", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        current: { clientHeight: 10 },
      } as Tooltip["container"];
      jest.spyOn(ref.current, "direction").mockReturnValue(["up", "right"]);

      const pos = ref.current.position();
      expect(pos.y).toEqual(ref.current.props.y - 10);
    });

    it("returns same point when container is available and direction is bottom right", () => {
      const ref = React.createRef<Tooltip>();
      render(<Tooltip ref={ref} x={5} y={5} />);
      if (!ref.current) throw new Error("ref not set");

      ref.current.container = {
        current: { clientWidth: 10, clientHeight: 10 },
      } as Tooltip["container"];

      jest.spyOn(ref.current, "direction").mockReturnValue(["down", "right"]);

      const pos = ref.current.position();

      expect(pos.x).toEqual(5);
      expect(pos.y).toEqual(5);
    });
  });

  describe("tipStyle()", () => {
    it("should return a unique style for each direction", () => {
      const refs = [
        React.createRef<Tooltip>(),
        React.createRef<Tooltip>(),
        React.createRef<Tooltip>(),
        React.createRef<Tooltip>(),
      ];

      render(
        <>
          <Tooltip ref={refs[0]} />
          <Tooltip ref={refs[1]} />
          <Tooltip ref={refs[2]} />
          <Tooltip ref={refs[3]} />
        </>,
      );

      jest
        .spyOn(refs[0].current as Tooltip, "direction")
        .mockReturnValue(["up", "left"]);
      jest
        .spyOn(refs[1].current as Tooltip, "direction")
        .mockReturnValue(["up", "right"]);
      jest
        .spyOn(refs[2].current as Tooltip, "direction")
        .mockReturnValue(["down", "left"]);
      jest
        .spyOn(refs[3].current as Tooltip, "direction")
        .mockReturnValue(["down", "right"]);

      const styles = refs.map((r) => r.current?.tipStyle());

      expect(new Set(styles.map((s) => JSON.stringify(s))).size).toBe(
        styles.length,
      );
    });
  });

  describe("containerStyle()", () => {
    it("should return a unique style for each direction", () => {
      const refs = [
        React.createRef<Tooltip>(),
        React.createRef<Tooltip>(),
        React.createRef<Tooltip>(),
        React.createRef<Tooltip>(),
      ];

      render(
        <>
          <Tooltip ref={refs[0]} />
          <Tooltip ref={refs[1]} />
          <Tooltip ref={refs[2]} />
          <Tooltip ref={refs[3]} />
        </>,
      );

      jest
        .spyOn(refs[0].current as Tooltip, "direction")
        .mockReturnValue(["up", "left"]);
      jest
        .spyOn(refs[1].current as Tooltip, "direction")
        .mockReturnValue(["up", "right"]);
      jest
        .spyOn(refs[2].current as Tooltip, "direction")
        .mockReturnValue(["down", "left"]);
      jest
        .spyOn(refs[3].current as Tooltip, "direction")
        .mockReturnValue(["down", "right"]);

      const styles = refs.map((r) => r.current?.containerStyle());

      expect(new Set(styles.map((s) => JSON.stringify(s))).size).toBe(
        styles.length,
      );
    });
  });
});
