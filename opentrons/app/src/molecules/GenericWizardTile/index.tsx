import * as React from 'react'
import { useSelector } from 'react-redux'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_INLINE_BLOCK,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { Tooltip } from '../../atoms/Tooltip'
import { NeedHelpLink } from '../../organisms/CalibrationPanels'
import { SmallButton } from '../../atoms/buttons'

const ALIGN_BUTTONS = css`
  align-items: ${ALIGN_FLEX_END};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-items: ${ALIGN_CENTER};
  }
`

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  }
`
const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};
    &:hover {
      opacity: 100%;
    }
    &:active {
      opacity: 70%;
    }
  }
`
const GO_BACK_BUTTON_DISABLED_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey60};
`
const Title = styled.h1`
  ${TYPOGRAPHY.h1Default};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold};
    height: ${SPACING.spacing40};
    display: ${DISPLAY_INLINE_BLOCK};
  }
`

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
export interface GenericWizardTileProps {
  rightHandBody: React.ReactNode
  bodyText: React.ReactNode
  header: string | React.ReactNode
  getHelp?: string
  back?: () => void
  proceed?: () => void
  proceedButtonText?: React.ReactNode
  proceedIsDisabled?: boolean
  proceedButton?: JSX.Element
  backIsDisabled?: boolean
  disableProceedReason?: string
}

export function GenericWizardTile(props: GenericWizardTileProps): JSX.Element {
  const {
    rightHandBody,
    bodyText,
    header,
    getHelp,
    back,
    proceed,
    proceedButtonText,
    proceedIsDisabled,
    proceedButton,
    backIsDisabled,
    disableProceedReason,
  } = props
  const { t } = useTranslation('shared')
  const isOnDevice = useSelector(getIsOnDevice)
  const [targetProps, tooltipProps] = useHoverTooltip()

  let buttonPositioning: string = ''
  if (
    (back != null || getHelp != null) &&
    (proceedButton != null || proceed != null)
  ) {
    buttonPositioning = JUSTIFY_SPACE_BETWEEN
  } else if (
    back == null &&
    getHelp == null &&
    (proceedButton != null || proceed != null)
  ) {
    buttonPositioning = JUSTIFY_FLEX_END
  } else if ((back != null || getHelp != null) && proceed == null) {
    buttonPositioning = JUSTIFY_START
  }

  return (
    <Flex css={TILE_CONTAINER_STYLE}>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          gridGap={isOnDevice ? SPACING.spacing8 : SPACING.spacing16}
        >
          <Flex display={DISPLAY_INLINE_BLOCK}>
            {typeof header === 'string' ? <Title>{header}</Title> : header}
          </Flex>
          {bodyText}
        </Flex>
        <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
          {rightHandBody}
        </Flex>
      </Flex>
      <Flex justifyContent={buttonPositioning} css={ALIGN_BUTTONS}>
        {back != null ? (
          <Btn onClick={back} disabled={backIsDisabled} aria-label="back">
            <LegacyStyledText
              css={
                backIsDisabled ?? false
                  ? GO_BACK_BUTTON_DISABLED_STYLE
                  : GO_BACK_BUTTON_STYLE
              }
            >
              {t('go_back')}
            </LegacyStyledText>
          </Btn>
        ) : null}
        {getHelp != null ? <NeedHelpLink href={getHelp} /> : null}
        {proceed != null && proceedButton == null ? (
          isOnDevice ? (
            <>
              <SmallButton
                disabled={proceedIsDisabled}
                buttonText={proceedButtonText}
                onClick={proceed}
                {...targetProps}
              />
              {disableProceedReason != null && (
                <Tooltip tooltipProps={tooltipProps}>
                  {disableProceedReason}
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <PrimaryButton
                disabled={proceedIsDisabled}
                css={CAPITALIZE_FIRST_LETTER_STYLE}
                onClick={proceed}
                {...targetProps}
              >
                {proceedButtonText}
              </PrimaryButton>
              {disableProceedReason != null && (
                <Tooltip tooltipProps={tooltipProps}>
                  {disableProceedReason}
                </Tooltip>
              )}
            </>
          )
        ) : null}
        {proceed == null && proceedButton != null ? proceedButton : null}
      </Flex>
    </Flex>
  )
}
