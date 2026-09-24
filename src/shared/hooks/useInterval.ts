import { useEffect, useRef } from 'react'

/**
 * Run `callback` every `ms` while the tab is visible. Used where what is shown
 * depends on the clock, e.g. a live class moving from "Upcoming" to "Live now".
 */
export function useInterval(callback: () => void, ms: number) {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') saved.current()
    }, ms)
    return () => window.clearInterval(id)
  }, [ms])
}
