import React from 'react'

export default function Button (props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        background: 'white',
        color: '#4A4A4A',
        border: '1px solid #E0E0E0',
        borderRadius: 8,
        textDecoration: 'none',
        cursor: 'pointer',
        lineHeight: 1.5,
        fontSize: 16,
        ...props.style
      }}
    />
  )
}
