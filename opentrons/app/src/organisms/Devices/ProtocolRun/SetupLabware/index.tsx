import * as React from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import {
  JUSTIFY_CENTER,
  Flex,
  SPACING,
  PrimaryButton,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { getModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  useIsFlex,
  useModuleRenderInfoForProtocolById,
  useStoredProtocolAnalysis,
} from '../../hooks'
import { BackToTopButton } from '../BackToTopButton'
import { SetupLabwareMap } from './SetupLabwareMap'
import { SetupLabwareList } from './SetupLabwareList'

import type { StepKey } from '../ProtocolRunSetup'

interface SetupLabwareProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  nextStep: StepKey | null
  expandStep: (step: StepKey) => void
}

export function SetupLabware(props: SetupLabwareProps): JSX.Element {
  const { robotName, runId, nextStep, expandStep, protocolRunHeaderRef } = props
  const { t } = useTranslation('protocol_setup')
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view') as string,
    t('map_view') as string
  )
  const isFlex = useIsFlex(robotName)

  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(runId)
  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing32}
      >
        {toggleGroup}
        {selectedValue === t('list_view') ? (
          <SetupLabwareList
            attachedModuleInfo={moduleRenderInfoById}
            commands={protocolAnalysis?.commands ?? []}
            extraAttentionModules={moduleTypesThatRequireExtraAttention}
            isFlex={isFlex}
          />
        ) : (
          <SetupLabwareMap runId={runId} protocolAnalysis={protocolAnalysis} />
        )}
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing16}>
        {nextStep == null ? (
          <BackToTopButton
            protocolRunHeaderRef={protocolRunHeaderRef}
            robotName={robotName}
            runId={runId}
            sourceLocation="SetupLabware"
          />
        ) : (
          <PrimaryButton
            onClick={() => {
              expandStep(nextStep)
            }}
          >
            {t('proceed_to_liquid_setup_step')}
          </PrimaryButton>
        )}
      </Flex>
    </>
  )
}
