import React, { CSSProperties } from 'react'

export interface Props {
  style?: CSSProperties
  color: string
}

export default (props: Props) => <div style={{
  ...(props.style || {}),
  height: 14,
  width: 14,
  borderRadius: 4,
  backgroundColor: props.color,
  display: 'inline-block'
}} />
