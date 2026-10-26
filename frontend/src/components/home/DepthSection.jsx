import React from 'react'

/**
 * DepthSection: Non-sticky 3D perspective wrapper.
 * Houses the outer .depth-exit-layer (exit recession) and inner .depth-enter-layer (entrance).
 * Neither layer ever intercepts or breaks position: sticky / fixed because this is used only
 * on normal in-flow section containers.
 */
export default function DepthSection({
  id,
  className = '',
  enter = true,
  exit = true,
  children,
  style,
  as: Component = 'div',
  ...rest
}) {
  return (
    <Component
      className={`depth-stage ${className}`}
      data-depth-id={id}
      style={style}
      {...rest}
    >
      <div className={`depth-exit-layer ${exit ? 'anim-exit' : ''}`}>
        <div className={`depth-enter-layer ${enter ? 'anim-enter' : ''}`}>
          {children}
        </div>
      </div>
    </Component>
  )
}
