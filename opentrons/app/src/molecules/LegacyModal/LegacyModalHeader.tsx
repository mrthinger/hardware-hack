import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Divider } from '../../atoms/structure'
import type { IconProps } from '@opentrons/components'

export interface LegacyModalHeaderProps {
  onClose?: React.MouseEventHandler
  title: React.ReactNode
  backgroundColor?: string
  color?: string
  icon?: IconProps
  closeButton?: React.ReactNode
}

const closeIconStyles = css`
  display: flex;
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  border-radius: 0.875rem;
  width: 1.625rem;
  height: 1.625rem;
  &:hover {
    background-color: ${COLORS.grey30};
  }

  &:active {
    background-color: ${COLORS.grey35};
  }
`

export const LegacyModalHeader = (
  props: LegacyModalHeaderProps
): JSX.Element => {
  const { icon, onClose, title, backgroundColor, color, closeButton } = props
  return (
    <>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        paddingX={SPACING.spacing24}
        paddingY={SPACING.spacing16}
        backgroundColor={backgroundColor}
        data-testid="Modal_header"
      >
        <Flex>
          {icon != null && <Icon {...icon} data-testid="Modal_header_icon" />}
          <LegacyStyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={color}
          >
            {title}
          </LegacyStyledText>
        </Flex>
        {closeButton != null
          ? closeButton
          : onClose != null && (
              <Btn
                onClick={onClose}
                css={closeIconStyles}
                data-testid={`ModalHeader_icon_close${
                  typeof title === 'string' ? `_${title}` : ''
                }`}
              >
                <Icon
                  name="close"
                  width={SPACING.spacing24}
                  height={SPACING.spacing24}
                  color={color}
                />
              </Btn>
            )}
      </Flex>
      <Divider width="100%" marginY="0" />
    </>
  )
}
