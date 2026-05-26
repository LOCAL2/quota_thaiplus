import { useMotionValue, useSpring } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'

interface CountUpProps {
  to: number
  from?: number
  direction?: 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
  startWhen?: boolean
  separator?: string
  onStart?: () => void
  onEnd?: () => void
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const motionValue = useMotionValue(direction === 'down' ? to : from)
  const damping     = 20 + 40 * (1 / duration)
  const stiffness   = 100 * (1 / duration)
  const springValue = useSpring(motionValue, { damping, stiffness })

  const getDecimalPlaces = (num: number) => {
    const str = num.toString()
    if (str.includes('.')) {
      const decimals = str.split('.')[1]
      if (parseInt(decimals) !== 0) return decimals.length
    }
    return 0
  }

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to))

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0
      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      }
      const formatted = Intl.NumberFormat('en-US', options).format(latest)
      return separator ? formatted.replace(/,/g, separator) : formatted
    },
    [maxDecimals, separator]
  )

  // ── animate to new `to` whenever it changes ──────────────────────────────
  useEffect(() => {
    if (!startWhen) return

    // if from === to, just display the value immediately without animating
    if (from === to) {
      if (ref.current) ref.current.textContent = formatValue(to)
      return
    }

    if (typeof onStart === 'function') onStart()

    const timeoutId = setTimeout(() => {
      motionValue.set(direction === 'down' ? from : to)
    }, delay * 1000)

    const endId = setTimeout(() => {
      if (typeof onEnd === 'function') onEnd()
    }, delay * 1000 + duration * 1000)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(endId)
    }
    // re-run whenever `to` changes — this is the key fix
  }, [to, startWhen, motionValue, direction, from, delay, duration, onStart, onEnd])

  // ── write formatted value to DOM on every spring tick ────────────────────
  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest)
    })
    return () => unsubscribe()
  }, [springValue, formatValue])

  // ── set initial display ───────────────────────────────────────────────────
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? to : from)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <span className={className} ref={ref} />
}
