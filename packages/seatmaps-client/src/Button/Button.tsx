import React from "react";

interface Props extends React.HTMLProps<HTMLDivElement> {
  icon?: React.ReactNode;
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
        gap: isMobile ? "4px" : "6px",
        ...(style || {}),
      }}
    >
      {icon}
      {text}
    </div>
  );
}
