import * as React from 'react'
import { css } from 'styled-components'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  useHoverTooltip,
  useMountEffect,
} from '@opentrons/components'

import { getTopPortalEl } from '../../App/portal'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { Divider } from '../../atoms/structure'
import { Tooltip } from '../../atoms/Tooltip'
import { ChooseProtocolSlideout } from '../../organisms/ChooseProtocolSlideout'
import { DisconnectModal } from '../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
import { handleUpdateBuildroot } from '../../organisms/Devices/RobotSettings/UpdateBuildroot'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import { UNREACHABLE, CONNECTABLE, REACHABLE } from '../../redux/discovery'
import { checkShellUpdate } from '../../redux/shell'
import { restartRobot } from '../../redux/robot-admin'
import { home, ROBOT } from '../../redux/robot-controls'
import { useIsRobotBusy } from './hooks'
import { useCanDisconnect } from '../../resources/networking/hooks'
import { useIsEstopNotDisengaged } from '../../resources/devices/hooks/useIsEstopNotDisengaged'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch, State } from '../../redux/types'

interface RobotOverviewOverflowMenuProps {
  robot: DiscoveredRobot
}

export const RobotOverviewOverflowMenu = (
  props: RobotOverviewOverflowMenuProps
): JSX.Element => {
  const { robot } = props
  const { t } = useTranslation(['devices_landing', 'robot_controls', 'shared'])
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const history = useHistory()
  const isRobotBusy = useIsRobotBusy()
  const runId = useCurrentRunId()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robot.name)

  const dispatch = useDispatch<Dispatch>()

  const handleClickRestart: React.MouseEventHandler<HTMLButtonElement> = () => {
    dispatch(restartRobot(robot.name))
  }

  const handleClickHomeGantry: React.MouseEventHandler<HTMLButtonElement> = () => {
    dispatch(home(robot.name, ROBOT))
  }

  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)
  const [showDisconnectModal, setShowDisconnectModal] = React.useState<boolean>(
    false
  )

  const canDisconnect = useCanDisconnect(robot.name)

  const handleClickDisconnect: React.MouseEventHandler<HTMLButtonElement> = () => {
    setShowDisconnectModal(true)
  }

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = () => {
    setShowChooseProtocolSlideout(true)
  }

  const { autoUpdateAction } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robot.name)
  })
  const isRobotOnWrongVersionOfSoftware =
    autoUpdateAction === 'upgrade' || autoUpdateAction === 'downgrade'
  const isRobotUnavailable = isRobotBusy || robot?.status !== CONNECTABLE
  const isUpdateSoftwareItemVisible =
    isRobotOnWrongVersionOfSoftware &&
    !isRobotUnavailable &&
    !isEstopNotDisengaged

  return (
    <Flex data-testid="RobotOverview_overflowMenu" position={POSITION_RELATIVE}>
      {showDisconnectModal
        ? createPortal(
            <DisconnectModal
              onCancel={() => {
                setShowDisconnectModal(false)
              }}
              robotName={robot.name}
            />,
            getTopPortalEl()
          )
        : null}
      <OverflowBtn aria-label="overflow" onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius={BORDERS.borderRadius8}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.25rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setShowOverflowMenu(false)
          }}
        >
          {isUpdateSoftwareItemVisible ? (
            <MenuItem
              onClick={() => {
                handleUpdateBuildroot(robot)
              }}
              data-testid={`RobotOverviewOverflowMenu_updateSoftware_${String(
                robot.name
              )}`}
              css={css`
                border-radius: ${BORDERS.borderRadius8} ${BORDERS.borderRadius8}
                  0 0;
              `}
            >
              {t('update_robot_software')}
            </MenuItem>
          ) : null}
          {robot.status === CONNECTABLE && runId == null ? (
            <>
              <MenuItem
                {...targetProps}
                onClick={handleClickRun}
                disabled={
                  isRobotOnWrongVersionOfSoftware ||
                  isRobotBusy ||
                  isEstopNotDisengaged
                }
                data-testid={`RobotOverflowMenu_${robot.name}_runProtocol`}
                css={
                  !isUpdateSoftwareItemVisible
                    ? css`
                        border-radius: ${BORDERS.borderRadius8}
                          ${BORDERS.borderRadius8} 0 0;
                      `
                    : undefined
                }
              >
                {t('run_a_protocol')}
              </MenuItem>
              {isRobotOnWrongVersionOfSoftware && (
                <Tooltip tooltipProps={tooltipProps} whiteSpace="normal">
                  {t('shared:a_software_update_is_available')}
                </Tooltip>
              )}
            </>
          ) : null}
          <MenuItem
            disabled={isRobotUnavailable || isEstopNotDisengaged}
            onClick={handleClickHomeGantry}
            data-testid={`RobotOverviewOverflowMenu_homeGantry_${String(
              robot.name
            )}`}
          >
            {t('home_gantry')}
          </MenuItem>
          {robot.status === CONNECTABLE ? (
            <MenuItem
              disabled={isRobotBusy || !canDisconnect || isEstopNotDisengaged}
              onClick={handleClickDisconnect}
            >
              {t('disconnect_from_network')}
            </MenuItem>
          ) : null}
          <MenuItem
            disabled={isRobotUnavailable}
            onClick={handleClickRestart}
            data-testid={`RobotOverviewOverflowMenu_restartRobot_${String(
              robot.name
            )}`}
          >
            {t('robot_controls:restart_label')}
          </MenuItem>
          <Divider marginY="0" />
          <MenuItem
            onClick={() => {
              history.push(`/devices/${robot.name}/robot-settings`)
            }}
            disabled={
              robot == null ||
              robot?.status === UNREACHABLE ||
              (robot?.status === REACHABLE &&
                robot?.serverHealthStatus !== 'ok')
            }
            data-testid={`RobotOverviewOverflowMenu_robotSettings_${String(
              robot.name
            )}`}
            css={css`
              border-radius: 0 0 ${BORDERS.borderRadius8}
                ${BORDERS.borderRadius8};
            `}
          >
            {t('robot_settings')}
          </MenuItem>
        </Flex>
      ) : null}
      {robot.status === CONNECTABLE ? (
        <ChooseProtocolSlideout
          robot={robot}
          showSlideout={showChooseProtocolSlideout}
          onCloseClick={() => {
            setShowChooseProtocolSlideout(false)
          }}
        />
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
