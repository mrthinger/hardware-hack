import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import {
  useStopRunMutation,
  useDismissCurrentRunMutation,
} from '@opentrons/react-api-client'

import { SmallButton } from '../../../atoms/buttons'
import { Modal } from '../../../molecules/Modal'
import { useTrackProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useRunStatus } from '../../../organisms/RunTimeControl/hooks'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '../../../redux/analytics'
import { getLocalRobot } from '../../../redux/discovery'
import { CancelingRunModal } from './CancelingRunModal'

import type { ModalHeaderBaseProps } from '../../../molecules/Modal/types'

interface ConfirmCancelRunModalProps {
  runId: string
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  isActiveRun: boolean
  protocolId?: string | null
}

export function ConfirmCancelRunModal({
  runId,
  setShowConfirmCancelRunModal,
  isActiveRun,
  protocolId,
}: ConfirmCancelRunModalProps): JSX.Element {
  const { t } = useTranslation(['run_details', 'shared'])
  const { stopRun } = useStopRunMutation()
  const {
    dismissCurrentRun,
    isLoading: isDismissing,
  } = useDismissCurrentRunMutation()
  const runStatus = useRunStatus(runId)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ?? ''
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const history = useHistory()
  const [isCanceling, setIsCanceling] = React.useState(false)

  const modalHeader: ModalHeaderBaseProps = {
    title: t('cancel_run_modal_heading'),
    hasExitIcon: false,
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  const handleCancelRun = (): void => {
    setIsCanceling(true)
    stopRun(runId, {
      onError: () => {
        setIsCanceling(false)
      },
    })
  }

  React.useEffect(() => {
    if (runStatus === RUN_STATUS_STOPPED) {
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.CANCEL })
      dismissCurrentRun(runId)
      if (!isActiveRun) {
        if (protocolId != null) {
          history.push(`/protocols/${protocolId}`)
        } else {
          history.push(`/protocols`)
        }
      }
    }
  }, [runStatus])

  return isCanceling || isDismissing ? (
    <CancelingRunModal />
  ) : (
    <Modal
      modalSize="medium"
      header={modalHeader}
      onOutsideClick={() => {
        setShowConfirmCancelRunModal(false)
      }}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          paddingBottom={SPACING.spacing32}
          paddingTop={`${isActiveRun ? SPACING.spacing32 : '0'}`}
        >
          <LegacyStyledText as="p">
            {t('cancel_run_alert_info_flex')}
          </LegacyStyledText>
          <LegacyStyledText as="p">
            {t('cancel_run_module_info')}
          </LegacyStyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          width="100%"
        >
          <SmallButton
            flex="1"
            buttonText={t('shared:go_back')}
            onClick={() => {
              setShowConfirmCancelRunModal(false)
            }}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('cancel_run')}
            onClick={handleCancelRun}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
