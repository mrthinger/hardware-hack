import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  parseAllRequiredModuleModels,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { Line } from '../../../atoms/structure'
import { InfoMessage } from '../../../molecules/InfoMessage'
import { INCOMPATIBLE, INEXACT_MATCH } from '../../../redux/pipettes'
import {
  getIsFixtureMismatch,
  getRequiredDeckConfig,
} from '../../../resources/deck_configuration/utils'
import { useDeckConfigurationCompatibility } from '../../../resources/deck_configuration/hooks'
import {
  useIsFlex,
  useModuleCalibrationStatus,
  useProtocolAnalysisErrors,
  useRobot,
  useRunCalibrationStatus,
  useRunHasStarted,
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '../hooks'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { SetupLabware } from './SetupLabware'
import { SetupLabwarePositionCheck } from './SetupLabwarePositionCheck'
import { SetupRobotCalibration } from './SetupRobotCalibration'
import { SetupModuleAndDeck } from './SetupModuleAndDeck'
import { SetupStep } from './SetupStep'
import { SetupLiquids } from './SetupLiquids'
import { EmptySetupStep } from './EmptySetupStep'
import { HowLPCWorksModal } from './SetupLabwarePositionCheck/HowLPCWorksModal'

import type { ProtocolCalibrationStatus } from '../hooks'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LPC_KEY = 'labware_position_check_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const
const LIQUID_SETUP_KEY = 'liquid_setup_step' as const

export type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LPC_KEY
  | typeof LABWARE_SETUP_KEY
  | typeof LIQUID_SETUP_KEY

interface ProtocolRunSetupProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function ProtocolRunSetup({
  protocolRunHeaderRef,
  robotName,
  runId,
}: ProtocolRunSetupProps): JSX.Element | null {
  const { t, i18n } = useTranslation('protocol_setup')
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const modules = parseAllRequiredModuleModels(protocolAnalysis?.commands ?? [])

  const robot = useRobot(robotName)
  const calibrationStatusRobot = useRunCalibrationStatus(robotName, runId)
  const calibrationStatusModules = useModuleCalibrationStatus(robotName, runId)
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const isFlex = useIsFlex(robotName)
  const runHasStarted = useRunHasStarted(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    null
  )
  const robotType = isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    protocolAnalysis
  )
  const runPipetteInfoByMount = useRunPipetteInfoByMount(runId)

  const isMissingPipette =
    (runPipetteInfoByMount.left != null &&
      runPipetteInfoByMount.left.requestedPipetteMatch === INCOMPATIBLE) ||
    (runPipetteInfoByMount.right != null &&
      runPipetteInfoByMount.right.requestedPipetteMatch === INCOMPATIBLE) ||
    // for Flex, require exact match
    (isFlex &&
      runPipetteInfoByMount.left != null &&
      runPipetteInfoByMount.left.requestedPipetteMatch === INEXACT_MATCH) ||
    (isFlex &&
      runPipetteInfoByMount.right != null &&
      runPipetteInfoByMount.right.requestedPipetteMatch === INEXACT_MATCH)

  const isFixtureMismatch = getIsFixtureMismatch(deckConfigCompatibility)

  const isMissingModule = missingModuleIds.length > 0

  const stepsKeysInOrder =
    protocolAnalysis != null
      ? [
          ROBOT_CALIBRATION_STEP_KEY,
          MODULE_SETUP_KEY,
          LPC_KEY,
          LABWARE_SETUP_KEY,
          LIQUID_SETUP_KEY,
        ]
      : [ROBOT_CALIBRATION_STEP_KEY, LPC_KEY, LABWARE_SETUP_KEY]

  const targetStepKeyInOrder = stepsKeysInOrder.filter((stepKey: StepKey) => {
    if (protocolAnalysis == null) {
      return stepKey !== MODULE_SETUP_KEY && stepKey !== LIQUID_SETUP_KEY
    }

    if (
      protocolAnalysis.modules.length === 0 &&
      protocolAnalysis.liquids.length === 0
    ) {
      return stepKey !== MODULE_SETUP_KEY && stepKey !== LIQUID_SETUP_KEY
    }

    if (protocolAnalysis.modules.length === 0) {
      return stepKey !== MODULE_SETUP_KEY
    }

    if (protocolAnalysis.liquids.length === 0) {
      return stepKey !== LIQUID_SETUP_KEY
    }
    return true
  })

  if (robot == null) return null

  const liquids = protocolAnalysis?.liquids ?? []
  const liquidsInLoadOrder =
    protocolAnalysis != null
      ? parseLiquidsInLoadOrder(liquids, protocolAnalysis.commands)
      : []
  const hasLiquids = liquidsInLoadOrder.length > 0
  const hasModules = protocolAnalysis != null && modules.length > 0
  // need config compatibility (including check for single slot conflicts)
  const requiredDeckConfigCompatibility = getRequiredDeckConfig(
    deckConfigCompatibility
  )
  const hasFixtures = requiredDeckConfigCompatibility.length > 0
  const flexDeckHardwareDescription =
    hasModules || hasFixtures
      ? t('install_modules_and_fixtures')
      : t('no_deck_hardware_specified')
  const ot2DeckHardwareDescription = hasModules
    ? t('install_modules', { count: modules.length })
    : t('no_deck_hardware_specified')

  const StepDetailMap: Record<
    StepKey,
    { stepInternals: JSX.Element; description: string }
  > = {
    [ROBOT_CALIBRATION_STEP_KEY]: {
      stepInternals: (
        <SetupRobotCalibration
          robotName={robotName}
          runId={runId}
          nextStep={
            targetStepKeyInOrder[
              targetStepKeyInOrder.findIndex(
                v => v === ROBOT_CALIBRATION_STEP_KEY
              ) + 1
            ]
          }
          expandStep={setExpandedStepKey}
          calibrationStatus={calibrationStatusRobot}
        />
      ),
      // change description for Flex
      description: isFlex
        ? t(`${ROBOT_CALIBRATION_STEP_KEY}_description_pipettes_only`)
        : t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <SetupModuleAndDeck
          expandLabwarePositionCheckStep={() => {
            setExpandedStepKey(LPC_KEY)
          }}
          robotName={robotName}
          runId={runId}
          hasModules={hasModules}
          protocolAnalysis={protocolAnalysis}
        />
      ),
      description: isFlex
        ? flexDeckHardwareDescription
        : ot2DeckHardwareDescription,
    },
    [LPC_KEY]: {
      stepInternals: (
        <SetupLabwarePositionCheck
          {...{ runId, robotName }}
          expandLabwareStep={() => {
            setExpandedStepKey(LABWARE_SETUP_KEY)
          }}
        />
      ),
      description: t('labware_position_check_step_description'),
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <SetupLabware
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
          nextStep={
            targetStepKeyInOrder.findIndex(v => v === LABWARE_SETUP_KEY) ===
            targetStepKeyInOrder.length - 1
              ? null
              : LIQUID_SETUP_KEY
          }
          expandStep={setExpandedStepKey}
        />
      ),
      description: t(`${LABWARE_SETUP_KEY}_description`),
    },
    [LIQUID_SETUP_KEY]: {
      stepInternals: (
        <SetupLiquids
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
          protocolAnalysis={protocolAnalysis}
        />
      ),
      description: hasLiquids
        ? t(`${LIQUID_SETUP_KEY}_description`)
        : i18n.format(t('liquids_not_in_the_protocol'), 'capitalize'),
    },
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      margin={SPACING.spacing16}
    >
      {protocolAnalysis != null ? (
        <>
          {runHasStarted ? (
            <InfoMessage title={t('setup_is_view_only')} />
          ) : null}
          {analysisErrors != null && analysisErrors?.length > 0 ? (
            <LegacyStyledText alignSelf={ALIGN_CENTER} color={COLORS.grey50}>
              {t('protocol_analysis_failed')}
            </LegacyStyledText>
          ) : (
            stepsKeysInOrder.map((stepKey, index) => {
              const setupStepTitle = t(`${stepKey}_title`)
              const showEmptySetupStep =
                (stepKey === 'liquid_setup_step' && !hasLiquids) ||
                (stepKey === 'module_setup_step' &&
                  ((!isFlex && !hasModules) ||
                    (isFlex && !hasModules && !hasFixtures)))
              return (
                <Flex flexDirection={DIRECTION_COLUMN} key={stepKey}>
                  {showEmptySetupStep ? (
                    <EmptySetupStep
                      title={t(`${stepKey}_title`)}
                      description={StepDetailMap[stepKey].description}
                      label={t('step', { index: index + 1 })}
                    />
                  ) : (
                    <SetupStep
                      expanded={stepKey === expandedStepKey}
                      label={t('step', { index: index + 1 })}
                      title={setupStepTitle}
                      description={StepDetailMap[stepKey].description}
                      toggleExpanded={() => {
                        stepKey === expandedStepKey
                          ? setExpandedStepKey(null)
                          : setExpandedStepKey(stepKey)
                      }}
                      rightElement={
                        <StepRightElement
                          {...{
                            stepKey,
                            runHasStarted,

                            calibrationStatusRobot,
                            calibrationStatusModules,
                            isFlex,
                            isMissingModule,
                            isFixtureMismatch,
                            isMissingPipette,
                          }}
                        />
                      }
                    >
                      {StepDetailMap[stepKey].stepInternals}
                    </SetupStep>
                  )}
                  {index !== stepsKeysInOrder.length - 1 ? (
                    <Line marginTop={SPACING.spacing24} />
                  ) : null}
                </Flex>
              )
            })
          )}
        </>
      ) : (
        <LegacyStyledText alignSelf={ALIGN_CENTER} color={COLORS.grey50}>
          {t('loading_data')}
        </LegacyStyledText>
      )}
    </Flex>
  )
}

interface StepRightElementProps {
  stepKey: StepKey
  calibrationStatusRobot: ProtocolCalibrationStatus
  calibrationStatusModules?: ProtocolCalibrationStatus
  runHasStarted: boolean
  isFlex: boolean
  isMissingModule: boolean
  isFixtureMismatch: boolean
  isMissingPipette: boolean
}
function StepRightElement(props: StepRightElementProps): JSX.Element | null {
  const {
    stepKey,
    runHasStarted,
    calibrationStatusRobot,
    calibrationStatusModules,
    isFlex,
    isMissingModule,
    isFixtureMismatch,
    isMissingPipette,
  } = props
  const { t } = useTranslation('protocol_setup')
  const isActionNeeded = isMissingModule || isFixtureMismatch

  if (
    !runHasStarted &&
    (stepKey === ROBOT_CALIBRATION_STEP_KEY || stepKey === MODULE_SETUP_KEY)
  ) {
    const moduleAndDeckStatus = isActionNeeded
      ? { complete: false }
      : calibrationStatusModules
    const calibrationStatus =
      stepKey === ROBOT_CALIBRATION_STEP_KEY
        ? calibrationStatusRobot
        : moduleAndDeckStatus

    let statusText = t('calibration_ready')
    if (
      stepKey === ROBOT_CALIBRATION_STEP_KEY &&
      !calibrationStatusRobot.complete
    ) {
      statusText = isMissingPipette
        ? t('action_needed')
        : t('calibration_needed')
    } else if (stepKey === MODULE_SETUP_KEY && !calibrationStatus?.complete) {
      statusText = isActionNeeded ? t('action_needed') : t('calibration_needed')
    }

    // do not render calibration ready status icon for OT-2 module setup
    return isFlex ||
      !(
        stepKey === MODULE_SETUP_KEY && statusText === t('calibration_ready')
      ) ? (
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon
          size="1rem"
          color={calibrationStatus?.complete ? COLORS.green50 : COLORS.yellow50}
          marginRight={SPACING.spacing8}
          name={calibrationStatus?.complete ? 'ot-check' : 'alert-circle'}
          id="RunSetupCard_calibrationIcon"
        />
        <LegacyStyledText
          color={COLORS.black90}
          css={TYPOGRAPHY.pSemiBold}
          marginRight={SPACING.spacing16}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          id="RunSetupCard_calibrationText"
          whiteSpace="nowrap"
        >
          {statusText}
        </LegacyStyledText>
      </Flex>
    ) : null
  } else if (stepKey === LPC_KEY) {
    return <LearnAboutLPC />
  } else {
    return null
  }
}

function LearnAboutLPC(): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [showLPCHelpModal, setShowLPCHelpModal] = React.useState(false)
  return (
    <>
      <Link
        css={TYPOGRAPHY.linkPSemiBold}
        marginRight={SPACING.spacing16}
        whiteSpace="nowrap"
        onClick={(e: React.MouseEvent) => {
          // clicking link shouldn't toggle step expanded state
          e.preventDefault()
          e.stopPropagation()
          setShowLPCHelpModal(true)
        }}
      >
        {t('learn_how_it_works')}
      </Link>
      {showLPCHelpModal ? (
        <HowLPCWorksModal
          onCloseClick={() => {
            setShowLPCHelpModal(false)
          }}
        />
      ) : null}
    </>
  )
}
