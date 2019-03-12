import React from 'react'

export default function Button (props: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: '13px',
        outline: 'none',
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(props.style || {})
      }}
    />
  )
}
