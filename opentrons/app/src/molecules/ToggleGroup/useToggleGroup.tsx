import * as React from 'react'
import { css } from 'styled-components'
import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  PrimaryButton,
} from '@opentrons/components'
import { useTrackEvent } from '../../redux/analytics'

const BUTTON_GROUP_STYLES = css`
  border-radius: ${BORDERS.borderRadius8};
  margin-top: -1px;
  width: fit-content;

  button {
    height: 28px;
    width: auto;
    font-weight: 400;
    font-size: 11px;
    line-height: 14px;
    box-shadow: none;
    padding-top: 6px;
    padding-bottom: 8px;
    &:focus {
      box-shadow: none;
      color: ${COLORS.white};
      background-color: ${COLORS.blue50};
    }

    &:hover {
      background-color: ${COLORS.grey10};
      color: ${COLORS.black90};
      box-shadow: 0 0 0;
    }

    &.active {
      background-color: ${COLORS.blue50};
      color: ${COLORS.white};
    }

    &:disabled {
      background-color: inherit;
      color: ${COLORS.grey40};
    }
  }

  button:first-child {
    border-radius: ${BORDERS.borderRadius8} 0 0 ${BORDERS.borderRadius8};
    border-right: none;
  }

  button:last-child {
    border-radius: 0 ${BORDERS.borderRadius8} ${BORDERS.borderRadius8} 0;
    border-left: none;
  }
`

const ACTIVE_STYLE = css`
  padding-left: ${SPACING.spacing8};
  padding-right: ${SPACING.spacing8};
  background-color: ${COLORS.blue50};
  color: ${COLORS.white};
  pointer-events: none;
`

const DEFAULT_STYLE = css`
  padding-left: ${SPACING.spacing8};
  padding-right: ${SPACING.spacing8};
  background-color: ${COLORS.white};
  color: ${COLORS.black90};
  border: 1px ${COLORS.grey30} solid;
`

export const useToggleGroup = (
  left: string,
  right: string,
  trackEventName?: string
): [string, React.ReactNode] => {
  const [selectedValue, setSelectedValue] = React.useState<string>(left)
  const trackEvent = useTrackEvent()
  const handleLeftClick = (): void => {
    setSelectedValue(left)
    if (trackEventName != null) {
      trackEvent({
        name: trackEventName,
        properties: { view: 'list' },
      })
    }
  }
  const handleRightClick = (): void => {
    setSelectedValue(right)
    if (trackEventName != null) {
      trackEvent({
        name: trackEventName,
        properties: { view: 'map' },
      })
    }
  }

  return [
    selectedValue,
    <Flex css={BUTTON_GROUP_STYLES} key="toggleGroup">
      <PrimaryButton
        css={selectedValue === left ? ACTIVE_STYLE : DEFAULT_STYLE}
        key={left}
        onClick={handleLeftClick}
        data-testid="useToggleGroup_leftButton"
      >
        {left}
      </PrimaryButton>
      <PrimaryButton
        css={selectedValue === right ? ACTIVE_STYLE : DEFAULT_STYLE}
        key={right}
        onClick={handleRightClick}
        data-testid="useToggleGroup_rightButton"
      >
        {right}
      </PrimaryButton>
    </Flex>,
  ]
}
