import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { NavLink, useHistory } from 'react-router-dom'

import {
  Flex,
  Icon,
  POSITION_ABSOLUTE,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  COLORS,
  useOnClickOutside,
  useHoverTooltip,
  Box,
  SPACING,
  SIZE_1,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useDeleteRunMutation } from '@opentrons/react-api-client'

import { Divider } from '../../atoms/structure'
import { Tooltip } from '../../atoms/Tooltip'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useRunControls } from '../../organisms/RunTimeControl/hooks'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
} from '../../redux/analytics'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { useDownloadRunLog, useTrackProtocolRunEvent, useRobot } from './hooks'
import { useIsEstopNotDisengaged } from '../../resources/devices/hooks/useIsEstopNotDisengaged'

import type { Run } from '@opentrons/api-client'
import type { State } from '../../redux/types'

export interface HistoricalProtocolRunOverflowMenuProps {
  runId: string
  robotName: string
  robotIsBusy: boolean
}

export function HistoricalProtocolRunOverflowMenu(
  props: HistoricalProtocolRunOverflowMenuProps
): JSX.Element {
  const { runId, robotName } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const protocolRunOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const { downloadRunLog, isRunLogLoading } = useDownloadRunLog(
    robotName,
    runId
  )
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      data-testid="HistoricalProtocolRunOverflowMenu_OverflowMenu"
    >
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        onClick={handleOverflowClick}
        disabled={isEstopNotDisengaged}
      />
      {showOverflowMenu ? (
        <>
          <Box
            ref={protocolRunOverflowWrapperRef}
            data-testid={`HistoricalProtocolRunOverflowMenu_${runId}`}
          >
            <MenuDropdown
              {...props}
              downloadRunLog={downloadRunLog}
              isRunLogLoading={isRunLogLoading}
              closeOverflowMenu={handleOverflowClick}
            />
          </Box>
          {menuOverlay}
        </>
      ) : null}
    </Flex>
  )
}

interface MenuDropdownProps extends HistoricalProtocolRunOverflowMenuProps {
  closeOverflowMenu: React.MouseEventHandler<HTMLButtonElement>
  downloadRunLog: () => void
  isRunLogLoading: boolean
}
function MenuDropdown(props: MenuDropdownProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const history = useHistory()

  const {
    runId,
    robotName,
    robotIsBusy,
    closeOverflowMenu,
    downloadRunLog,
    isRunLogLoading,
  } = props

  const isRobotOnWrongVersionOfSoftware = ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => {
      return getRobotUpdateDisplayInfo(state, robotName)
    })?.autoUpdateAction
  )
  const [targetProps, tooltipProps] = useHoverTooltip()
  const onResetSuccess = (createRunResponse: Run): void => {
    history.push(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
    )
  }
  const onDownloadClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
    closeOverflowMenu(e)
  }
  const trackEvent = useTrackEvent()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const { reset } = useRunControls(runId, onResetSuccess)
  const { deleteRun } = useDeleteRunMutation()
  const robot = useRobot(robotName)
  const robotSerialNumber =
    robot?.health?.robot_serial ?? robot?.serverHealth?.serialNumber ?? null

  const handleResetClick: React.MouseEventHandler<HTMLButtonElement> = (
    e
  ): void => {
    e.preventDefault()
    e.stopPropagation()

    reset()
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: {
        sourceLocation: 'HistoricalProtocolRun',
        robotSerialNumber,
      },
    })
    trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN })
  }

  const handleDeleteClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    deleteRun(runId)
    closeOverflowMenu(e)
  }

  return (
    <Flex
      whiteSpace="nowrap"
      zIndex={10}
      borderRadius="4px 4px 0px 0px"
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.3rem"
      right={0}
      flexDirection={DIRECTION_COLUMN}
    >
      <NavLink to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}>
        <MenuItem data-testid="RecentProtocolRun_OverflowMenu_viewRunRecord">
          {t('view_run_record')}
        </MenuItem>
      </NavLink>
      <MenuItem
        {...targetProps}
        onClick={handleResetClick}
        disabled={robotIsBusy || isRobotOnWrongVersionOfSoftware}
        data-testid="RecentProtocolRun_OverflowMenu_rerunNow"
      >
        {t('rerun_now')}
      </MenuItem>
      {isRobotOnWrongVersionOfSoftware && (
        <Tooltip tooltipProps={tooltipProps}>
          {t('shared:a_software_update_is_available')}
        </Tooltip>
      )}
      <MenuItem
        data-testid="RecentProtocolRun_OverflowMenu_downloadRunLog"
        disabled={isRunLogLoading}
        onClick={onDownloadClick}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          {t('download_run_log')}
          {isRunLogLoading ? (
            <Icon
              name="ot-spinner"
              size={SIZE_1}
              color={COLORS.grey50}
              aria-label="spinner"
              spin
            />
          ) : null}
        </Flex>
      </MenuItem>
      <Divider marginY="0" />
      <MenuItem
        onClick={handleDeleteClick}
        data-testid="RecentProtocolRun_OverflowMenu_deleteRun"
      >
        {t('delete_run')}
      </MenuItem>
    </Flex>
  )
}
