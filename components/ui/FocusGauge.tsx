import { cn } from '@/lib/utils'
import type { CSSProperties, SVGProps } from 'react'

export interface FocusGaugeProps extends Omit<SVGProps<SVGSVGElement>, 'className'> {
  value: number
  size?: number | string
  gapPercent?: number
  strokeWidth?: number
  equal?: boolean
  showValue?: boolean

  primary?: 'danger' | 'warning' | 'success' | 'info' | string | { [key: number]: string }
  secondary?: 'danger' | 'warning' | 'success' | 'info' | string | { [key: number]: string }

  transition?: {
    length?: number
    step?: number
    delay?: number
  }

  className?:
    | string
    | {
        svgClassName?: string
        primaryClassName?: string
        secondaryClassName?: string
        textClassName?: string
      }
}

const REFINED_COLORS: Record<string, string> = {
  danger: '#F04438',
  warning: '#F79009',
  info: '#4F7CFF',
  success: '#12B76A',
}

const REFINED_TRACK: Record<string, string> = {
  danger: 'rgba(240,68,56,0.15)',
  warning: 'rgba(247,144,9,0.15)',
  info: 'rgba(79,124,255,0.15)',
  success: 'rgba(18,183,106,0.15)',
}

function FocusGauge({
  value,
  size = '100%',
  gapPercent = 5,
  strokeWidth = 6,
  equal = false,
  showValue = true,

  primary,
  secondary,

  transition = {
    length: 500,
    step: 200,
    delay: 0
  },

  className,

  ...props
}: FocusGaugeProps) {
  const strokePercent = value

  const circleSize = 100
  const radius = circleSize / 2 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius

  const percentToDegree = 360 / 100
  const percentToPx = circumference / 100

  const offsetFactor = equal ? 0.5 : 0
  const offsetFactorSecondary = 1 - offsetFactor

  const primaryStrokeDasharray = () => {
    if (offsetFactor > 0 && strokePercent > 100 - gapPercent * 2 * offsetFactor) {
      const subtract = -strokePercent + 100

      return `${Math.max(strokePercent * percentToPx - subtract * percentToPx, 0)} ${circumference}`
    } else {
      const subtract = gapPercent * 2 * offsetFactor

      return `${Math.max(strokePercent * percentToPx - subtract * percentToPx, 0)} ${circumference}`
    }
  }

  const secondaryStrokeDasharray = () => {
    if (offsetFactorSecondary < 1 && strokePercent < gapPercent * 2 * offsetFactorSecondary) {
      const subtract = strokePercent

      return `${Math.max((100 - strokePercent) * percentToPx - subtract * percentToPx, 0)} ${circumference}`
    } else {
      const subtract = gapPercent * 2 * offsetFactorSecondary

      return `${Math.max((100 - strokePercent) * percentToPx - subtract * percentToPx, 0)} ${circumference}`
    }
  }

  const primaryTransform = () => {
    if (offsetFactor > 0 && strokePercent > 100 - gapPercent * 2 * offsetFactor) {
      const add = 0.5 * (-strokePercent + 100)

      return `rotate(${-90 + add * percentToDegree}deg)`
    } else {
      const add = gapPercent * offsetFactor

      return `rotate(${-90 + add * percentToDegree}deg)`
    }
  }

  const secondaryTransform = () => {
    if (offsetFactorSecondary < 1 && strokePercent < gapPercent * 2 * offsetFactorSecondary) {
      const subtract = 0.5 * strokePercent

      return `rotate(${360 - 90 - subtract * percentToDegree}deg) scaleY(-1)`
    } else {
      const subtract = gapPercent * offsetFactorSecondary

      return `rotate(${360 - 90 - subtract * percentToDegree}deg) scaleY(-1)`
    }
  }

  const resolveColor = (
    val: typeof primary,
    fallbackKey: 'danger' | 'warning' | 'info' | 'success',
  ): string => {
    if (!val) {
      if (strokePercent <= 25) return REFINED_COLORS.danger
      if (strokePercent <= 50) return REFINED_COLORS.warning
      if (strokePercent <= 75) return REFINED_COLORS.info
      return REFINED_COLORS.success
    }
    if (typeof val === 'string') {
      return REFINED_COLORS[val] || val
    }
    const keys = Object.keys(val).sort((a, b) => Number(a) - Number(b))
    for (let i = 0; i < keys.length; i++) {
      const currentKey = Number(keys[i])
      const nextKey = Number(keys[i + 1])
      if (strokePercent >= currentKey && (strokePercent < nextKey || !nextKey)) {
        const v = val[currentKey] || ''
        return REFINED_COLORS[v] || v
      }
    }
    return REFINED_COLORS[fallbackKey]
  }

  const resolveTrack = (val: typeof secondary, key: 'danger' | 'warning' | 'info' | 'success'): string => {
    if (!val) return 'var(--track)'
    if (typeof val === 'string') {
      return REFINED_TRACK[val] || val
    }
    return 'var(--track)'
  }

  const primaryStrokeColor = resolveColor(primary, 'info')
  const secondaryStrokeColor = resolveTrack(secondary, 'info')

  const primaryOpacityVal = () => {
    if (
      offsetFactor > 0 &&
      strokePercent < gapPercent * 2 * offsetFactor &&
      strokePercent < gapPercent * 2 * offsetFactorSecondary
    ) {
      return 0
    } else return 1
  }

  const secondaryOpacityVal = () => {
    if (
      (offsetFactor === 0 && strokePercent > 100 - gapPercent * 2) ||
      (offsetFactor > 0 &&
        strokePercent > 100 - gapPercent * 2 * offsetFactor &&
        strokePercent > 100 - gapPercent * 2 * offsetFactorSecondary)
    ) {
      return 0
    } else return 1
  }

  const circleStyles: CSSProperties = {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDashoffset: 0,
    strokeWidth: strokeWidth,
    transition: `stroke-dasharray ${transition?.length}ms ease-out, opacity ${transition?.length}ms ease-out`,
    transformOrigin: '50% 50%',
    shapeRendering: 'geometricPrecision'
  }

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`0 0 ${circleSize} ${circleSize}`}
      shapeRendering='crispEdges'
      width={size}
      height={size}
      style={{ userSelect: 'none' }}
      strokeWidth={2}
      fill='none'
      className={cn('', typeof className === 'string' ? className : className?.svgClassName)}
      {...props}
    >
      <circle
        cx={circleSize / 2}
        cy={circleSize / 2}
        r={radius}
        style={{
          ...circleStyles,
          strokeDasharray: secondaryStrokeDasharray(),
          transform: secondaryTransform(),
          stroke: secondaryStrokeColor,
          opacity: secondaryOpacityVal()
        }}
        className={cn('', typeof className === 'object' && className?.secondaryClassName)}
      />

      <circle
        cx={circleSize / 2}
        cy={circleSize / 2}
        r={radius}
        style={{
          ...circleStyles,
          strokeDasharray: primaryStrokeDasharray(),
          transform: primaryTransform(),
          stroke: primaryStrokeColor,
          opacity: primaryOpacityVal()
        }}
        className={cn('', typeof className === 'object' && className?.primaryClassName)}
      />

      {showValue && (
        <text
          x='50%'
          y='50%'
          textAnchor='middle'
          dominantBaseline='middle'
          alignmentBaseline='central'
          fill='currentColor'
          fontSize={32}
          className={cn('font-semibold tabular-nums', typeof className === 'object' && className?.textClassName)}
        >
          {Math.round(strokePercent)}
        </text>
      )}
    </svg>
  )
}

export { FocusGauge }
