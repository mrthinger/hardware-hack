import * as React from 'react'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

interface SetupStepProps {
  /** whether or not to show the full contents of the step */
  expanded: boolean
  /** always shown text name of the step */
  title: React.ReactNode
  /** always shown text that provides a one sentence explanation of the contents */
  description: string
  /** always shown text that sits above title of step (used for step number) */
  label: string
  /** callback that should toggle the expanded state (managed by parent) */
  toggleExpanded: () => void
  /** contents to be shown only when expanded */
  children: React.ReactNode
  /** element to be shown (right aligned) regardless of expanded state */
  rightElement: React.ReactNode
}

const EXPANDED_STYLE = css`
  transition: max-height 300ms ease-in, visibility 400ms ease;
  visibility: visible;
  max-height: 180vh;
  overflow: hidden;
`
const COLLAPSED_STYLE = css`
  transition: max-height 500ms ease-out, visibility 600ms ease;
  visibility: hidden;
  max-height: 0vh;
  overflow: hidden;
`
const ACCORDION_STYLE = css`
  border-radius: 50%;
  &:hover {
    background: ${COLORS.grey30};
  }
  &:active {
    background: ${COLORS.grey35};
  }
`
export function SetupStep({
  expanded,
  title,
  description,
  label,
  toggleExpanded,
  children,
  rightElement,
}: SetupStepProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Btn textAlign={TYPOGRAPHY.textAlignLeft}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
            onClick={toggleExpanded}
            gridGap={SPACING.spacing40}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <LegacyStyledText
                color={COLORS.grey50}
                css={TYPOGRAPHY.h6SemiBold}
                marginBottom={SPACING.spacing2}
                id={`CollapsibleStep_${label}`}
              >
                {label}
              </LegacyStyledText>
              <LegacyStyledText
                color={COLORS.black90}
                css={TYPOGRAPHY.h3SemiBold}
                marginBottom={SPACING.spacing4}
                id={`CollapsibleStep_${String(title)}`}
              >
                {title}
              </LegacyStyledText>
              <LegacyStyledText
                as="p"
                color={COLORS.black90}
                id={`CollapsibleStep_${description}`}
              >
                {description}
              </LegacyStyledText>
            </Flex>
            <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_ROW}>
              {rightElement}
              <Icon
                color={COLORS.black90}
                size="1.5rem"
                css={ACCORDION_STYLE}
                name={expanded ? 'minus' : 'plus'}
                margin={SPACING.spacing4}
              />
            </Flex>
          </Flex>
        </Flex>
      </Btn>
      <Box css={expanded ? EXPANDED_STYLE : COLLAPSED_STYLE}>{children}</Box>
    </Flex>
  )
}
