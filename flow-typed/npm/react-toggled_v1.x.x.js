// flow-typed signature: 4854eed5106436eee5d1b3ae2a4ad005
// flow-typed version: 3db99f5769/react-toggled_v1.x.x/flow_>=v0.54.1

declare module 'react-toggled' {
  declare export type ToggledProps = {
    on: boolean,
    getTogglerProps(): {
      'aria-expanded': boolean,
      tabIndex: 0,
      onClick(): void
    },
    getInputTogglerProps(): {
      'aria-expanded': boolean,
      tabIndex: 0,
      onKeyUp(): void,
      onClick(): void
    },
    getElementTogglerProps(): {
      'aria-expanded': boolean,
      tabIndex: 0,
      onKeyUp(): void,
      onClick(): void
    },
    setOn(): void,
    setOff(): void,
    toggle(): void
  };

  declare type ReactToggledProps = {
    defaultOn?: boolean,
    onToggle?: (on: boolean, p: ToggledProps) => void,
    on?: boolean,
    children: (ToggledProps) => React$Node | React$Node
  };

  declare module.exports: React$ComponentType<ReactToggledProps>;
}
