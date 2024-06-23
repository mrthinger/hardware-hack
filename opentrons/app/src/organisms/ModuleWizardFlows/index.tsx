import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'
import { COLORS, LegacyStyledText } from '@opentrons/components'
import {
  getModuleType,
  getModuleDisplayName,
  FLEX_CUTOUT_BY_SLOT_ID,
  SINGLE_SLOT_FIXTURES,
  getFixtureIdByCutoutIdFromModuleSlotName,
  getCutoutFixturesForModuleModel,
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { getTopPortalEl } from '../../App/portal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useAttachedPipettesFromInstrumentsQuery } from '../../organisms/Devices/hooks'
import {
  useChainMaintenanceCommands,
  useCreateTargetedMaintenanceRunMutation,
} from '../../resources/runs'
import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { getModuleCalibrationSteps } from './getModuleCalibrationSteps'
import { FLEX_SLOT_NAMES_BY_MOD_TYPE, SECTIONS } from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { AttachProbe } from './AttachProbe'
import { PlaceAdapter } from './PlaceAdapter'
import { SelectLocation } from './SelectLocation'
import { Success } from './Success'
import { DetachProbe } from './DetachProbe'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'
import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs'

import type { AttachedModule, CommandData } from '@opentrons/api-client'
import type {
  CreateCommand,
  CutoutConfig,
  SingleSlotCutoutFixtureId,
} from '@opentrons/shared-data'

interface ModuleWizardFlowsProps {
  attachedModule: AttachedModule
  closeFlow: () => void
  isPrepCommandLoading: boolean
  onComplete?: () => void
  prepCommandErrorMessage?: string
}

const RUN_REFETCH_INTERVAL = 5000

export const ModuleWizardFlows = (
  props: ModuleWizardFlowsProps
): JSX.Element | null => {
  const {
    attachedModule,
    isPrepCommandLoading,
    closeFlow,
    onComplete,
    prepCommandErrorMessage,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_wizard_flows')
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  const attachedPipette =
    attachedPipettes.left?.data.calibratedOffset?.last_modified != null
      ? attachedPipettes.left
      : attachedPipettes.right

  const moduleCalibrationSteps = getModuleCalibrationSteps()
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const moduleCutoutConfig = deckConfig.find(
    cc => cc.opentronsModuleSerialNumber === attachedModule.serialNumber
  )
  // mapping of cutoutId's occupied by the target module and their cutoutFixtureId's per cutout
  const fixtureIdByCutoutId =
    moduleCutoutConfig != null
      ? getFixtureIdByCutoutIdFromModuleSlotName(
          moduleCutoutConfig.cutoutId.replace('cutout', ''),
          getCutoutFixturesForModuleModel(attachedModule.moduleModel, deckDef),
          deckDef
        )
      : {}
  const occupiedCutouts = deckConfig.filter(
    (cutoutConfig: CutoutConfig) =>
      !SINGLE_SLOT_FIXTURES.includes(
        cutoutConfig.cutoutFixtureId as SingleSlotCutoutFixtureId
      ) && !Object.keys(fixtureIdByCutoutId).includes(cutoutConfig.cutoutId)
  )
  const availableSlotNames =
    FLEX_SLOT_NAMES_BY_MOD_TYPE[
      getModuleType(attachedModule.moduleModel)
    ]?.filter(
      slot =>
        !occupiedCutouts.some(
          (occCutout: CutoutConfig) =>
            occCutout.cutoutId === FLEX_CUTOUT_BY_SLOT_ID[slot]
        )
    ) ?? []

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const totalStepCount = moduleCalibrationSteps.length - 1
  const currentStep = moduleCalibrationSteps?.[currentStepIndex]

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex === 0 ? currentStepIndex : currentStepIndex - 1
    )
  }
  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = React.useState<
    string | null
  >(null)
  const [createdAdapterId, setCreatedAdapterId] = React.useState<string | null>(
    null
  )
  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = React.useState<boolean>(false)

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: createdMaintenanceRunId != null,
  })
  const {
    chainRunCommands,
    isCommandMutationLoading,
  } = useChainMaintenanceCommands()

  const {
    createTargetedMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: (response: {
      data: { id: React.SetStateAction<string | null> }
    }) => {
      setCreatedMaintenanceRunId(response.data.id)
    },
  })

  // this will close the modal in case the run was deleted by the terminate
  // activity modal on the ODD
  React.useEffect(() => {
    if (
      createdMaintenanceRunId !== null &&
      maintenanceRunData?.data.id === createdMaintenanceRunId
    ) {
      setMonitorMaintenanceRunForDeletion(true)
    }
    if (
      maintenanceRunData?.data.id !== createdMaintenanceRunId &&
      monitorMaintenanceRunForDeletion
    ) {
      closeFlow()
    }
  }, [
    maintenanceRunData?.data.id,
    createdMaintenanceRunId,
    monitorMaintenanceRunForDeletion,
    closeFlow,
  ])

  const [errorMessage, setErrorMessage] = React.useState<null | string>(null)
  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const proceed = (): void => {
    if (!isCommandMutationLoading) {
      setCurrentStepIndex(
        currentStepIndex !== totalStepCount
          ? currentStepIndex + 1
          : currentStepIndex
      )
    }
  }
  const handleClose = (): void => {
    setIsExiting(false)
    closeFlow()
    if (onComplete != null) onComplete()
  }

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => {
      handleClose()
    },
    onError: () => {
      handleClose()
    },
  })

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (maintenanceRunData?.data.id == null) handleClose()
    else {
      chainRunCommands(
        maintenanceRunData?.data.id as string,
        [{ commandType: 'home' as const, params: {} }],
        false
      )
        .then(() => {
          deleteMaintenanceRun(maintenanceRunData?.data.id)
        })
        .catch(error => {
          console.error(error.message)
          handleClose()
        })
    }
  }

  const [isRobotMoving, setIsRobotMoving] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (isCommandMutationLoading || isExiting) {
      setIsRobotMoving(true)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading, isExiting])

  let chainMaintenanceRunCommands

  if (maintenanceRunData?.data.id != null) {
    chainMaintenanceRunCommands = (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ): Promise<CommandData[]> =>
      chainRunCommands(
        maintenanceRunData?.data.id as string,
        commands,
        continuePastCommandFailure
      )
  }
  if (
    currentStep == null ||
    attachedPipette?.data.calibratedOffset?.last_modified == null
  )
    return null

  const maintenanceRunId =
    maintenanceRunData?.data.id != null &&
    maintenanceRunData?.data.id === createdMaintenanceRunId
      ? createdMaintenanceRunId
      : undefined
  const calibrateBaseProps = {
    attachedPipette,
    chainRunCommands: chainMaintenanceRunCommands,
    isRobotMoving,
    proceed,
    maintenanceRunId,
    goBack,
    setErrorMessage,
    errorMessage,
    isOnDevice,
    attachedModule,
    isExiting,
  }

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (isPrepCommandLoading) {
    modalContent = (
      <InProgressModal
        description={t('prepping_module', {
          module: getModuleDisplayName(attachedModule.moduleModel),
        })}
      />
    )
  } else if (prepCommandErrorMessage != null || errorMessage != null) {
    modalContent = (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t(
          prepCommandErrorMessage != null
            ? 'error_prepping_module'
            : 'error_during_calibration'
        )}
        subHeader={
          prepCommandErrorMessage != null ? (
            prepCommandErrorMessage
          ) : (
            <Trans
              t={t}
              i18nKey={'branded:module_calibration_failed'}
              values={{ error: errorMessage }}
              components={{
                block: <LegacyStyledText as="p" />,
              }}
            />
          )
        }
      />
    )
  } else if (isExiting) {
    modalContent = <InProgressModal description={t('stand_back_exiting')} />
  } else if (currentStep.section === SECTIONS.BEFORE_BEGINNING) {
    modalContent = <BeforeBeginning {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.SELECT_LOCATION) {
    modalContent = (
      <SelectLocation
        {...currentStep}
        {...calibrateBaseProps}
        availableSlotNames={availableSlotNames}
        deckConfig={deckConfig}
        occupiedCutouts={occupiedCutouts}
        configuredFixtureIdByCutoutId={fixtureIdByCutoutId}
      />
    )
  } else if (currentStep.section === SECTIONS.PLACE_ADAPTER) {
    modalContent = (
      <PlaceAdapter
        {...currentStep}
        {...calibrateBaseProps}
        deckConfig={deckConfig}
        setCreatedAdapterId={setCreatedAdapterId}
        createMaintenanceRun={createTargetedMaintenanceRun}
        isCreateLoading={isCreateLoading}
        createdMaintenanceRunId={createdMaintenanceRunId}
      />
    )
  } else if (currentStep.section === SECTIONS.ATTACH_PROBE) {
    modalContent = (
      <AttachProbe
        {...currentStep}
        {...calibrateBaseProps}
        deckConfig={deckConfig}
        adapterId={createdAdapterId}
        fixtureIdByCutoutId={fixtureIdByCutoutId}
      />
    )
  } else if (currentStep.section === SECTIONS.DETACH_PROBE) {
    modalContent = <DetachProbe {...currentStep} {...calibrateBaseProps} />
  } else if (currentStep.section === SECTIONS.SUCCESS) {
    modalContent = (
      <Success
        {...currentStep}
        {...calibrateBaseProps}
        isRobotMoving={isRobotMoving}
        proceed={isRobotMoving ? () => {} : handleCleanUpAndClose}
      />
    )
  }

  const wizardHeader = (
    <WizardHeader
      exitDisabled={isRobotMoving}
      title={t('module_calibration')}
      currentStep={currentStepIndex}
      totalSteps={totalStepCount}
      onExit={isRobotMoving ? undefined : handleCleanUpAndClose}
    />
  )

  return createPortal(
    isOnDevice ? (
      <LegacyModalShell>
        {wizardHeader}
        {modalContent}
      </LegacyModalShell>
    ) : (
      <LegacyModalShell width="47rem" height="auto" header={wizardHeader}>
        {modalContent}
      </LegacyModalShell>
    ),
    getTopPortalEl()
  )
}
