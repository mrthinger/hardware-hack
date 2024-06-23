import * as React from 'react'
import { css } from 'styled-components'

import {
  Btn,
  Icon,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { ODD_FOCUS_VISIBLE } from '../../../atoms/buttons/constants'

import type { RunStatus } from '@opentrons/api-client'

const PLAY_PAUSE_BUTTON_STYLE = css`
  display: flex;
  border-radius: 50%;
  background-color: ${COLORS.blue50};
  -webkit-tap-highlight-color: transparent;

  &:focus {
    background-color: ${COLORS.blue60};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.blue50};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.blue50};
  }
  &:active {
    background-color: ${COLORS.blue60};
  }
  &:disabled {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};
  }
`

interface PlayPauseButtonProps {
  onTogglePlayPause?: () => void
  /** default size 12.5rem */
  buttonSize?: string
  /** default size 5rem */
  iconSize?: string
  runStatus?: RunStatus | null
}

export function PlayPauseButton({
  onTogglePlayPause,
  buttonSize = '12.5rem',
  iconSize = '5rem',
  runStatus,
}: PlayPauseButtonProps): JSX.Element {
  const isRunning = runStatus === RUN_STATUS_RUNNING
  const iconName = isRunning ? 'pause' : 'play'
  return (
    <Btn
      css={PLAY_PAUSE_BUTTON_STYLE}
      height={buttonSize}
      width={buttonSize}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      onClick={onTogglePlayPause}
      aria-label={isRunning ? 'pause' : 'play'}
    >
      <Icon name={iconName} color={COLORS.white} size={iconSize} />
    </Btn>
  )
}
