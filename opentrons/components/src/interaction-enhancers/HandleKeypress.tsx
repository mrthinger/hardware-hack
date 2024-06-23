import * as React from 'react'
export interface KeypressHandler {
  key: string
  shiftKey?: boolean | null | undefined
  onPress: () => unknown
}

export interface HandleKeypressProps {
  /** array of keypress handlers to attach to the window */
  handlers: KeypressHandler[]
  /** optionally call event.preventDefault if keypress is handled */
  preventDefault?: boolean | null | undefined
  /** wrapped children */
  children?: React.ReactNode
}

const matchHandler = (e: KeyboardEvent) => (h: KeypressHandler) =>
  h.key === e.key && (h.shiftKey == null || h.shiftKey === e.shiftKey)

/**
 * Keypress handler wrapper component. Takes an array of keypress handlers
 * to call when a given key is pressed on the keyboard. Handler is called on
 * `keyup` event. `event.preventDefault` will be called if a key is handled
 * and `props.preventDefault` is true.
 */
export class HandleKeypress extends React.Component<HandleKeypressProps> {
  handlePressIfKey = (event: KeyboardEvent): void => {
    this.props.handlers.filter(matchHandler(event)).forEach(h => h.onPress())
  }

  preventDefaultIfKey = (event: KeyboardEvent): void => {
    if (!this.props.preventDefault) return

    const pressHandled = this.props.handlers.some(matchHandler(event))

    if (pressHandled) event.preventDefault()
  }

  componentDidMount(): void {
    window.addEventListener('keyup', this.handlePressIfKey)
    window.addEventListener('keyup', this.preventDefaultIfKey)
    window.addEventListener('keydown', this.preventDefaultIfKey)
  }

  componentWillUnmount(): void {
    window.removeEventListener('keyup', this.handlePressIfKey)
    window.removeEventListener('keyup', this.preventDefaultIfKey)
    window.removeEventListener('keydown', this.preventDefaultIfKey)
  }

  render(): JSX.Element {
    return <>{this.props.children}</>
  }
}
