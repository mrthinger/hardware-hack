import * as React from 'react'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { IconProps, StyleProps } from '@opentrons/components'

type InlineNotificationType = 'alert' | 'error' | 'neutral' | 'success'

export interface InlineNotificationProps extends StyleProps {
  /** name constant of the icon to display */
  type: InlineNotificationType
  /** InlineNotification contents */
  heading: string
  message?: string
  /** Optional dynamic width based on contents */
  hug?: boolean
  /** optional handler to show close button/clear alert  */
  onCloseClick?: (() => void) | React.MouseEventHandler<HTMLButtonElement>
}

const INLINE_NOTIFICATION_PROPS_BY_TYPE: Record<
  InlineNotificationType,
  { icon: IconProps; backgroundColor: string; color: string }
> = {
  alert: {
    icon: { name: 'ot-alert' },
    backgroundColor: COLORS.yellow30,
    color: COLORS.yellow60,
  },
  error: {
    icon: { name: 'ot-alert' },
    backgroundColor: COLORS.red30,
    color: COLORS.red60,
  },
  neutral: {
    icon: { name: 'information' },
    backgroundColor: COLORS.blue30,
    color: COLORS.blue60,
  },
  success: {
    icon: { name: 'ot-check' },
    backgroundColor: COLORS.green30,
    color: COLORS.green60,
  },
}

export function InlineNotification(
  props: InlineNotificationProps
): JSX.Element {
  const { heading, hug = false, onCloseClick, message, type } = props
  const fullHeading = `${heading}${message ? '. ' : ''}`
  const fullmessage = `${message}.`
  const inlineNotificationProps = INLINE_NOTIFICATION_PROPS_BY_TYPE[type]
  const iconProps = {
    ...inlineNotificationProps.icon,
    size: '1.75rem',
    color: INLINE_NOTIFICATION_PROPS_BY_TYPE[type].color,
  }
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={INLINE_NOTIFICATION_PROPS_BY_TYPE[type].backgroundColor}
      borderRadius={BORDERS.borderRadius12}
      data-testid={`InlineNotification_${type}`}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing12}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
      width={hug ? 'max-content' : '100%'}
    >
      <Icon {...iconProps} aria-label={`icon_${type}`} />
      <Flex flex="1" alignItems={ALIGN_CENTER}>
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight28}
        >
          <span
            css={`
              font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
            `}
          >
            {fullHeading}
          </span>
          {message != null && fullmessage}
        </LegacyStyledText>
      </Flex>
      {onCloseClick && (
        <Btn
          data-testid="InlineNotification_close-button"
          onClick={onCloseClick}
        >
          <Icon aria-label="close_icon" name="close" size="3rem" />
        </Btn>
      )}
    </Flex>
  )
}
