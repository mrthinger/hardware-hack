import * as React from 'react'
import { css } from 'styled-components'
import {
  Btn,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ButtonProps } from '@opentrons/components'

export interface InterstitialTitleBarProps {
  title: React.ReactNode
  exit?: ButtonProps
}

const TITLE_BAR = css`
  position: ${POSITION_ABSOLUTE};
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 3;
`

export function InterstitialTitleBar(
  props: InterstitialTitleBarProps
): JSX.Element {
  const { title, exit } = props

  return (
    <Flex
      width="100%"
      backgroundColor={COLORS.black90}
      color={COLORS.white}
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      css={TITLE_BAR}
      data-testid="titlebar"
    >
      <Flex padding={SPACING.spacing4} data-testid={`titlebar_${title}`}>
        <Icon
          name="ot-logo"
          width={TYPOGRAPHY.lineHeight18}
          height={TYPOGRAPHY.lineHeight18}
          paddingTop={SPACING.spacing2}
          aria-label="ot-logo"
        />
        <Flex
          paddingLeft={SPACING.spacing4}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH3}
        >
          {title}
        </Flex>
      </Flex>
      {exit != null && (
        <Flex
          paddingRight={TYPOGRAPHY.fontSizeH6}
          data-testid={`titlebar_${exit.title}`}
        >
          <LegacyStyledText
            paddingRight={SPACING.spacing8}
            paddingTop={SPACING.spacing4}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH3}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {exit.title}
          </LegacyStyledText>
          <Btn
            size="1.5rem"
            onClick={exit.onClick}
            paddingTop="3px"
            aria-label="close_btn"
          >
            <Icon name="close" aria-label="close" color={COLORS.white} />
          </Btn>
        </Flex>
      )}
    </Flex>
  )
}
