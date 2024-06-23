import * as React from 'react'
import { Link as InternalLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  AlertModal,
  DeprecatedCheckboxField,
  Link,
  useToggle,
} from '@opentrons/components'
import {
  useTrackEvent,
  ANALYTICS_U2E_DRIVE_ALERT_DISMISSED,
  ANALYTICS_U2E_DRIVE_LINK_CLICKED,
} from '../../redux/analytics'
import {
  U2E_DRIVER_UPDATE_URL,
  U2E_DRIVER_OUTDATED_MESSAGE,
  U2E_DRIVER_DESCRIPTION,
  U2E_DRIVER_OUTDATED_CTA,
} from '../../redux/system-info'
import type { AlertProps } from './types'

// TODO(mc, 2020-05-07): i18n
const DRIVER_OUT_OF_DATE = 'Realtek USB-to-Ethernet Driver Update Available'
const VIEW_ADAPTER_INFO = 'view adapter info'
const GET_UPDATE = 'get update'
const DONT_REMIND_ME_AGAIN = "Don't remind me again"

const ADAPTER_INFO_URL = '/more/network-and-system'

const LinkButton = styled(Link)`
  width: auto;
  padding-left: 1rem;
  padding-right: 1rem;
`

const IgnoreCheckbox = styled(DeprecatedCheckboxField)`
  position: absolute;
  left: 1rem;
  bottom: 1.5rem;
`

export function U2EDriverOutdatedAlert(props: AlertProps): JSX.Element {
  const trackEvent = useTrackEvent()
  const [rememberDismiss, toggleRememberDismiss] = useToggle()
  const { dismissAlert } = props

  return (
    <AlertModal
      alertOverlay
      heading={DRIVER_OUT_OF_DATE}
      buttons={[
        {
          Component: LinkButton,
          as: InternalLink,
          to: ADAPTER_INFO_URL,
          children: VIEW_ADAPTER_INFO,
          onClick: () => {
            dismissAlert(rememberDismiss)
            trackEvent({
              name: ANALYTICS_U2E_DRIVE_ALERT_DISMISSED,
              properties: { rememberDismiss },
            })
          },
        },
        {
          Component: LinkButton,
          href: U2E_DRIVER_UPDATE_URL,
          external: true,
          children: GET_UPDATE,
          onClick: () => {
            dismissAlert(rememberDismiss)
            trackEvent({
              name: ANALYTICS_U2E_DRIVE_LINK_CLICKED,
              properties: { source: 'modal' },
            })
          },
        },
      ]}
    >
      <p>
        {U2E_DRIVER_OUTDATED_MESSAGE} {U2E_DRIVER_DESCRIPTION}
      </p>
      <p>{U2E_DRIVER_OUTDATED_CTA}</p>
      <IgnoreCheckbox
        label={DONT_REMIND_ME_AGAIN}
        value={rememberDismiss}
        onChange={toggleRememberDismiss}
      />
    </AlertModal>
  )
}
