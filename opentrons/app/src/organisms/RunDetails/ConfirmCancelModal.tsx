import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  RUN_STATUS_STOPPED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '../../App/portal'
import { LegacyModal } from '../../molecules/LegacyModal'
import { useTrackProtocolRunEvent, useIsFlex } from '../Devices/hooks'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '../../redux/analytics'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
  runId: string
  robotName: string
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const { onClose, runId, robotName } = props
  const { stopRun } = useStopRunMutation()
  const [isCanceling, setIsCanceling] = React.useState(false)
  const runStatus = useRunStatus(runId)
  const isFlex = useIsFlex(robotName)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const { t } = useTranslation('run_details')

  const cancelRunAlertInfo = isFlex
    ? t('cancel_run_alert_info_flex')
    : t('cancel_run_alert_info_ot2')

  const cancelRun: React.MouseEventHandler<HTMLButtonElement> = (e): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsCanceling(true)
    stopRun(runId, {
      onSuccess: () => {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.CANCEL })
      },
      onError: () => {
        setIsCanceling(false)
      },
    })
  }
  React.useEffect(() => {
    if (
      runStatus === RUN_STATUS_STOP_REQUESTED ||
      runStatus === RUN_STATUS_STOPPED
    ) {
      onClose()
    }
  }, [runStatus, onClose])

  return createPortal(
    <LegacyModal
      type="warning"
      onClose={isCanceling ? undefined : onClose}
      title={t('cancel_run_modal_heading')}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p" marginBottom={SPACING.spacing24}>
          {cancelRunAlertInfo}
        </LegacyStyledText>
        <LegacyStyledText as="p" marginBottom={SPACING.spacing24}>
          {t('cancel_run_module_info')}
        </LegacyStyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          {isCanceling ? null : (
            <Link
              role="button"
              onClick={onClose}
              marginRight={SPACING.spacing24}
              css={TYPOGRAPHY.linkPSemiBold}
            >
              {t('cancel_run_modal_back')}
            </Link>
          )}
          <AlertPrimaryButton
            backgroundColor={COLORS.red50}
            onClick={cancelRun}
            disabled={isCanceling}
            minWidth="8rem"
          >
            {isCanceling ? (
              <Icon size={TYPOGRAPHY.fontSizeP} spin name="ot-spinner" />
            ) : (
              t('cancel_run_modal_confirm')
            )}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>,
    getTopPortalEl()
  )
}
