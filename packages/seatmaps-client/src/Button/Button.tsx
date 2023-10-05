import React from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props extends React.HTMLProps<HTMLDivElement> {
  icon?: IconDefinition;
  text?: string;
  isMobile?: boolean;
}

export default function Button({
  icon,
  text,
  style,
  isMobile,
  ...props
}: Props) {
  return (
    <div
      {...props}
      style={{
        backgroundColor: "transparent",
        borderRadius: 0,
        padding: isMobile ? "0.25em 0.5em" : "0.5em 1em",
        outline: "none",
        cursor: "pointer",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(style || {}),
      }}
    >
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          style={text ? { marginRight: isMobile ? 4 : 8 } : {}}
        />
      )}
      {text}
    </div>
  );
}
