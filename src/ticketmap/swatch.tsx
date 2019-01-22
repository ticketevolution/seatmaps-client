import React, { Component, CSSProperties} from 'react'

interface Props {
    style: CSSProperties
    color: string
}

const Swatch = (props: Props) => <div style={{
    ...props.style,
    height: 14,
    width: 14,
    borderRadius: 4,
    backgroundColor: props.color,
    display: 'inline-block'
}}/>

export default Swatch
