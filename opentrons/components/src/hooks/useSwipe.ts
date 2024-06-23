import { useState, useEffect, useRef } from 'react'
import interact from 'interactjs'
import type { MutableRefObject, CSSProperties } from 'react'

interface UseSwipeResult {
  ref: MutableRefObject<null>
  style: CSSProperties
  isEnabled: boolean
  setSwipeType: (value: string) => void
  swipeType: string
  enable: () => void
  disable: () => void
}

export const useSwipe = (): UseSwipeResult => {
  const [swipeType, setSwipeType] = useState<string>('')
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)
  const str = 'swipe'
  const swipeDirs = ['up', 'down', 'left', 'right']

  const enable = (): void => {
    if (interactiveRef?.current != null) {
      interact((interactiveRef.current as unknown) as HTMLElement)
        .draggable(true)
        .on('dragend', event => {
          if (!event.swipe) return

          swipeDirs.forEach(dir => {
            if (event.swipe[dir] != null) setSwipeType(`${str}-${dir}`)
          })
        })
    }
  }
  const disable = (): void => {
    if (interactiveRef?.current != null) {
      interact((interactiveRef.current as unknown) as HTMLElement).unset()
    }
  }

  useEffect(() => {
    if (isEnabled) {
      enable()
    } else {
      disable()
    }
    return disable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled])

  return {
    ref: interactiveRef,
    style: {
      touchAction: 'none',
    },
    isEnabled,
    setSwipeType,
    swipeType,
    enable: () => {
      setIsEnabled(true)
    },
    disable: () => {
      setIsEnabled(false)
    },
  }
}
