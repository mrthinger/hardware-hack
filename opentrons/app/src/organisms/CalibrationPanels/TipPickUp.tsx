import * as React from 'react'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  ALIGN_STRETCH,
  ALIGN_FLEX_END,
  PrimaryButton,
  LegacyStyledText,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import { JogControls } from '../../molecules/JogControls'
import type { CalibrationPanelProps } from './types'
import { formatJogVector } from './utils'

import { NeedHelpLink } from './NeedHelpLink'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'

import multiDemoAsset from '../../assets/videos/tip-pick-up/A1_Multi_Channel_REV1.webm'
import singleDemoAsset from '../../assets/videos/tip-pick-up/A1_Single_Channel_REV1.webm'

const ASSET_MAP = {
  multi: multiDemoAsset,
  single: singleDemoAsset,
}
export function TipPickUp(props: CalibrationPanelProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands, isMulti } = props

  const demoAsset = ASSET_MAP[isMulti ? 'multi' : 'single']
  const pickUpTip = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.PICK_UP_TIP })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }
  const [confirmLink, crashRecoveryConfirmation] = useConfirmCrashRecovery(
    props
  )

  return (
    crashRecoveryConfirmation ?? (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing32}
        minHeight="32rem"
      >
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignSelf={ALIGN_STRETCH}
          gridGap={SPACING.spacing8}
        >
          <Flex flexDirection={DIRECTION_COLUMN} flex="1">
            <LegacyStyledText as="h1" marginBottom={SPACING.spacing16}>
              {t('position_pipette_over_tip')}
            </LegacyStyledText>
            <Trans
              t={t}
              i18nKey="tip_pick_up_instructions"
              components={{
                block: (
                  <LegacyStyledText as="p" marginBottom={SPACING.spacing8} />
                ),
              }}
            />
          </Flex>
          <Box flex="1">
            <video
              key={demoAsset}
              css={css`
                max-width: 100%;
                max-height: 15rem;
              `}
              autoPlay={true}
              loop={true}
              controls={false}
            >
              <source src={demoAsset} />
            </video>
          </Box>
        </Flex>
        <JogControls jog={jog} />
        <Box alignSelf={ALIGN_FLEX_END}>{confirmLink}</Box>
        <Flex
          width="100%"
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginTop={SPACING.spacing16}
        >
          <NeedHelpLink />
          <PrimaryButton onClick={pickUpTip}>{t('pick_up_tip')}</PrimaryButton>
        </Flex>
      </Flex>
    )
  )
}
