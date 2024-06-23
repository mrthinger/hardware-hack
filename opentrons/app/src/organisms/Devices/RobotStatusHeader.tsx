import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { useProtocolQuery } from '@opentrons/react-api-client'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  LegacyStyledText,
  truncateString,
  TYPOGRAPHY,
  useHoverTooltip,
  useInterval,
} from '@opentrons/components'

import { QuaternaryButton } from '../../atoms/buttons'
import { Tooltip } from '../../atoms/Tooltip'
import { useIsFlex } from '../../organisms/Devices/hooks'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import {
  getRobotAddressesByName,
  HEALTH_STATUS_OK,
  OPENTRONS_USB,
} from '../../redux/discovery'
import { getNetworkInterfaces, fetchStatus } from '../../redux/networking'
import { useNotifyRunQuery } from '../../resources/runs'

import type { IconName, StyleProps } from '@opentrons/components'
import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { Dispatch, State } from '../../redux/types'

type RobotStatusHeaderProps = StyleProps &
  Pick<DiscoveredRobot, 'name' | 'local'> & {
    robotModel: string | null
  }

const STATUS_REFRESH_MS = 5000

interface RobotNameContainerProps {
  isGoToRun: boolean
}

export function RobotStatusHeader(props: RobotStatusHeaderProps): JSX.Element {
  const { name, local, robotModel, ...styleProps } = props
  const { t, i18n } = useTranslation([
    'devices_landing',
    'device_settings',
    'run_details',
  ])
  const history = useHistory()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const dispatch = useDispatch<Dispatch>()

  const isFlex = useIsFlex(name)
  const currentRunId = useCurrentRunId()
  const currentRunStatus = useCurrentRunStatus()
  const { data: runRecord } = useNotifyRunQuery(currentRunId, {
    staleTime: Infinity,
  })
  const protocolId = runRecord?.data?.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  const runningProtocolBanner: JSX.Element | null =
    currentRunId != null && currentRunStatus != null && displayName != null ? (
      <Flex
        alignItems={ALIGN_CENTER}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
        }}
      >
        <LegacyStyledText
          as="label"
          paddingRight={SPACING.spacing8}
          overflowWrap={OVERFLOW_WRAP_ANYWHERE}
        >
          {`${truncateString(displayName, 68)}; ${i18n.format(
            t(`run_details:status_${currentRunStatus}`),
            'lowerCase'
          )}`}
        </LegacyStyledText>
        <Link
          to={`/devices/${name}/protocol-runs/${currentRunId}/${
            currentRunStatus === RUN_STATUS_IDLE ? 'setup' : 'run-preview'
          }`}
          id={`RobotStatusHeader_${String(name)}_goToRun`}
        >
          <QuaternaryButton>{t('go_to_run')}</QuaternaryButton>
        </Link>
      </Flex>
    ) : null

  const { ethernet, wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, name)
  )

  const addresses = useSelector((state: State) =>
    getRobotAddressesByName(state, name)
  )

  const wifiAddress = addresses.find(addr => addr.ip === wifi?.ipAddress)
  const isConnectedViaWifi =
    wifiAddress != null && wifiAddress.healthStatus === HEALTH_STATUS_OK

  const ethernetAddress = addresses.find(
    addr => addr.ip === ethernet?.ipAddress
  )
  // do not show ethernet connection for OT-2
  const isFlexConnectedViaEthernet =
    isFlex &&
    ethernetAddress != null &&
    ethernetAddress.healthStatus === HEALTH_STATUS_OK

  const usbAddress = addresses.find(addr => addr.ip === OPENTRONS_USB)
  const isFlexConnectedViaUSB =
    usbAddress != null && usbAddress.healthStatus === HEALTH_STATUS_OK

  let iconName: IconName | null = null
  let tooltipTranslationKey = null
  if (isFlexConnectedViaEthernet) {
    iconName = 'ethernet'
    tooltipTranslationKey = 'device_settings:ethernet'
  } else if (isConnectedViaWifi) {
    iconName = 'wifi'
    tooltipTranslationKey = 'device_settings:wifi'
  } else if ((local != null && local) || isFlexConnectedViaUSB) {
    iconName = 'usb'
    tooltipTranslationKey = 'device_settings:wired_usb'
  }

  useInterval(() => dispatch(fetchStatus(name)), STATUS_REFRESH_MS, true)

  const RobotNameContainer = styled.div`
    max-width: ${(props: RobotNameContainerProps) =>
      props.isGoToRun ? `150px` : undefined};
    @media screen and (max-width: 678px) {
      max-width: ${(props: RobotNameContainerProps) =>
        props.isGoToRun ? `105px` : undefined};
    }
  `

  const isGoToRun =
    currentRunId != null && currentRunStatus != null && displayName != null

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} {...styleProps}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          as="h6"
          color={COLORS.grey60}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing2}
          textTransform={TYPOGRAPHY.textTransformUppercase}
          id={`RobotStatusHeader_${String(name)}_robotModel`}
        >
          {robotModel}
        </LegacyStyledText>
        <Flex alignItems={ALIGN_CENTER}>
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
            <RobotNameContainer isGoToRun={isGoToRun}>
              <LegacyStyledText
                as="h3"
                id={`RobotStatusHeader_${String(name)}_robotName`}
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {name}
              </LegacyStyledText>
            </RobotNameContainer>
            {iconName != null ? (
              <Btn
                {...targetProps}
                marginRight={SPACING.spacing8}
                onClick={() => {
                  history.push(`/devices/${name}/robot-settings/networking`)
                }}
              >
                <Icon
                  aria-label={iconName}
                  paddingTop={SPACING.spacing4}
                  name={iconName}
                  color={COLORS.grey60}
                  size="1.25rem"
                />
              </Btn>
            ) : null}
            <Tooltip tooltipProps={tooltipProps} width="auto">
              {tooltipTranslationKey != null ? t(tooltipTranslationKey) : ''}
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
      {runningProtocolBanner}
    </Flex>
  )
}
