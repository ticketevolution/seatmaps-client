import React from "react";

export default function (props: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        pointerEvents: "all",
        border: "2px solid lightgray",
        borderRadius: 5,
        display: "flex",
        backgroundColor: "white",
        ...(props.style || {}),
      }}
    />
  );
}
