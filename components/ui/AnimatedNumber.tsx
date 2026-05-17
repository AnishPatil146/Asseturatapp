'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  format?: (val: number) => string
  duration?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * AnimatedNumber
 * Smoothly interpolates from the previous number to the new number.
 */
export default function AnimatedNumber({
  value,
  format = (v) => v.toLocaleString(),
  duration = 300,
  className,
  style,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    if (value === prevValueRef.current) return

    const startValue = prevValueRef.current
    const endValue = value
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function: easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4)
      
      const current = startValue + (endValue - startValue) * ease
      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        prevValueRef.current = endValue
      }
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [value, duration])

  return (
    <span className={className} style={style}>
      {format(displayValue)}
    </span>
  )
}
