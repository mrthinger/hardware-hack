import * as React from 'react'

import { COLOR_WARNING } from '../styles'
import { Icon } from './Icon'
import { ICON_DATA_BY_NAME } from './icon-data'

import type { IconProps, IconName } from './Icon'

export interface NotificationIconProps extends IconProps {
  /** name constant of the optional notifcation icon to display */
  childName: IconName | null
  /** color to apply to notification icon (defaults to COLOR_WARNING) */
  childColor?: string
}

const SCALE_FACTOR = 3

/**
 * Inline SVG icon component with additional nested notification icon. Takes
 * all the same props as Icon in addition to the ones listed above.
 */
export function NotificationIcon(props: NotificationIconProps): JSX.Element {
  const { childName, childColor, ...iconProps } = props
  const { viewBox } = ICON_DATA_BY_NAME[iconProps.name]
  const [x, y, width, height] = viewBox.split(' ').map(Number)
  const scaledWidth = width / SCALE_FACTOR
  const scaledHeight = height / SCALE_FACTOR

  return (
    <Icon {...iconProps}>
      {childName && (
        <Icon
          name={childName}
          color={childColor ?? COLOR_WARNING}
          x={x + (SCALE_FACTOR - 1) * scaledWidth}
          y={y + (SCALE_FACTOR - 1) * scaledHeight}
          svgWidth={scaledWidth}
          svgHeight={scaledHeight}
        />
      )}
    </Icon>
  )
}
