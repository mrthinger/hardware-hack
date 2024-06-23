import * as React from 'react'
import { SPACING, COLORS, Box } from '@opentrons/components'
import { LegacyModalHeader } from './LegacyModalHeader'
import { LegacyModalShell } from './LegacyModalShell'
import type { IconProps, StyleProps } from '@opentrons/components'

type ModalType = 'info' | 'warning' | 'error'
export * from './LegacyModalShell'
export * from './LegacyModalHeader'

export interface LegacyModalProps extends StyleProps {
  type?: ModalType
  onClose?: React.MouseEventHandler
  closeOnOutsideClick?: boolean
  title?: React.ReactNode
  fullPage?: boolean
  childrenPadding?: string | number
  children?: React.ReactNode
  footer?: React.ReactNode
}

/**
 * For Desktop app use only.
 */
export const LegacyModal = (props: LegacyModalProps): JSX.Element => {
  const {
    type = 'info',
    onClose,
    closeOnOutsideClick,
    title,
    childrenPadding = `${SPACING.spacing16} ${SPACING.spacing24} ${SPACING.spacing24}`,
    children,
    footer,
    ...styleProps
  } = props

  const iconColor = (type: ModalType): string => {
    let iconColor: string = ''
    switch (type) {
      case 'warning':
        iconColor = COLORS.yellow50
        break
      case 'error':
        iconColor = COLORS.red50
        break
    }
    return iconColor
  }

  const modalIcon: IconProps = {
    name: 'ot-alert',
    color: iconColor(type),
    size: '1.25rem',
    marginRight: SPACING.spacing8,
  }

  const modalHeader = (
    <LegacyModalHeader
      onClose={onClose}
      title={title}
      icon={['error', 'warning'].includes(type) ? modalIcon : undefined}
      color={COLORS.black90}
      backgroundColor={COLORS.white}
    />
  )

  return (
    <LegacyModalShell
      width={styleProps.width ?? '31.25rem'}
      header={modalHeader}
      onOutsideClick={closeOnOutsideClick ?? false ? onClose : undefined}
      // center within viewport aside from nav
      marginLeft={styleProps.marginLeft ?? '5.656rem'}
      {...styleProps}
      footer={footer}
    >
      <Box padding={childrenPadding}>{children}</Box>
    </LegacyModalShell>
  )
}
