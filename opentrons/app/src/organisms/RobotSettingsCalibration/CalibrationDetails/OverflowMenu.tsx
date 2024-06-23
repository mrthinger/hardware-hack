import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'file-saver'
import { css } from 'styled-components'

import {
  Flex,
  BORDERS,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  useOnClickOutside,
} from '@opentrons/components'
import { isFlexPipette, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import {
  useDeleteCalibrationMutation,
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
} from '@opentrons/react-api-client'

import { Divider } from '../../../atoms/structure'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import {
  useTrackEvent,
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
} from '../../../redux/analytics'
import {
  useRunStatuses,
  useAttachedPipettesFromInstrumentsQuery,
} from '../../../organisms/Devices/hooks'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { FLOWS } from '../../PipetteWizardFlows/constants'
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'

import type { Mount } from '@opentrons/components'
import type { PipetteName } from '@opentrons/shared-data'
import type { DeleteCalRequestParams } from '@opentrons/api-client'
import type { SelectablePipettes } from '../../PipetteWizardFlows/types'

interface OverflowMenuProps {
  calType: 'pipetteOffset' | 'tipLength'
  robotName: string
  mount: Mount
  serialNumber: string | null
  updateRobotStatus: (isRobotBusy: boolean) => void
  pipetteName?: string | null
  tiprackDefURI?: string | null
}

export function OverflowMenu({
  calType,
  robotName,
  mount,
  serialNumber,
  updateRobotStatus,
  pipetteName,
  tiprackDefURI = null,
}: OverflowMenuProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'shared',
    'robot_calibration',
  ])
  const doTrackEvent = useTrackEvent()
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const calsOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const pipetteOffsetCalibrations = useAllPipetteOffsetCalibrationsQuery().data
    ?.data

  const tipLengthCalibrations = useAllTipLengthCalibrationsQuery().data?.data
  const { isRunRunning: isRunning } = useRunStatuses()
  const [
    showPipetteWizardFlows,
    setShowPipetteWizardFlows,
  ] = React.useState<boolean>(false)
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const isPipetteForFlex = isFlexPipette(pipetteName as PipetteName)
  const ot3PipCal =
    useAttachedPipettesFromInstrumentsQuery()[mount]?.data?.calibratedOffset
      ?.last_modified ?? null

  const applicablePipetteOffsetCal = pipetteOffsetCalibrations?.find(
    p => p.mount === mount && p.pipette === serialNumber
  )
  const applicableTipLengthCal = tipLengthCalibrations?.find(
    cal => cal.pipette === serialNumber && cal.uri === tiprackDefURI
  )

  const calibrationPresent =
    calType === 'pipetteOffset'
      ? applicablePipetteOffsetCal != null
      : applicableTipLengthCal != null
  const handleRecalibrate = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (
      !isRunning &&
      isPipetteForFlex &&
      calType === 'pipetteOffset' &&
      pipetteName != null
    ) {
      setShowPipetteWizardFlows(true)
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  const handleDownload = (e: React.MouseEvent): void => {
    e.preventDefault()
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: {},
    })

    if (calType === 'pipetteOffset') {
      saveAs(
        new Blob([JSON.stringify(pipetteOffsetCalibrations)]),
        `opentrons-${robotName}-pipette-offset-calibration.json`
      )
    } else if (calType === 'tipLength') {
      saveAs(
        new Blob([JSON.stringify(tipLengthCalibrations)]),
        `opentrons-${robotName}-tip-length-calibration.json`
      )
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  React.useEffect(() => {
    if (isRunning) {
      updateRobotStatus(true)
    }
  }, [isRunning, updateRobotStatus])

  const { deleteCalibration } = useDeleteCalibrationMutation()
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleDeleteCalibration = (e: React.MouseEvent): void => {
    e.preventDefault()
    let params: DeleteCalRequestParams
    if (calType === 'pipetteOffset') {
      if (applicablePipetteOffsetCal == null) return
      params = {
        calType,
        mount,
        pipette_id: applicablePipetteOffsetCal.pipette,
      }
    } else {
      if (applicableTipLengthCal == null) return
      params = {
        calType,
        tiprack_uri: applicableTipLengthCal.uri,
        pipette_id: applicableTipLengthCal.pipette,
      }
    }

    deleteCalibration(params)

    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label={`CalibrationOverflowMenu_button_${calType}`}
        onClick={handleOverflowClick}
        disabled={isEstopNotDisengaged}
      />
      {showPipetteWizardFlows ? (
        <PipetteWizardFlows
          flowType={FLOWS.CALIBRATE}
          mount={mount}
          closeFlow={() => {
            setShowPipetteWizardFlows(false)
          }}
          selectedPipette={selectedPipette}
          onComplete={() => {
            setSelectedPipette(SINGLE_MOUNT_PIPETTES)
          }}
        />
      ) : null}
      {showOverflowMenu ? (
        <Flex
          ref={calsOverflowWrapperRef}
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius={BORDERS.borderRadius8}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          {isPipetteForFlex ? (
            <MenuItem
              onClick={handleRecalibrate}
              css={css`
                border-radius: ${BORDERS.borderRadius8};
              `}
            >
              {t(
                ot3PipCal == null
                  ? 'robot_calibration:calibrate_pipette'
                  : 'robot_calibration:recalibrate_pipette'
              )}
            </MenuItem>
          ) : (
            <>
              <MenuItem
                onClick={handleDownload}
                disabled={!calibrationPresent}
                css={css`
                  border-radius: ${BORDERS.borderRadius8}
                    ${BORDERS.borderRadius8} 0 0;
                `}
              >
                {t('download_calibration_data')}
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleDeleteCalibration}
                disabled={!calibrationPresent}
                css={css`
                  border-radius: 0 0 ${BORDERS.borderRadius8}
                    ${BORDERS.borderRadius8};
                `}
              >
                {t('robot_calibration:delete_calibration_data')}
              </MenuItem>
            </>
          )}
        </Flex>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
