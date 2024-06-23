import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  OVERFLOW_AUTO,
  OVERFLOW_WRAP_ANYWHERE,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { LegacyModal } from '../../../molecules/LegacyModal'
import { useDownloadRunLog } from '../hooks'

import type { RunError } from '@opentrons/api-client'
import type { LegacyModalProps } from '../../../molecules/LegacyModal'

/**
 * This modal is for Desktop app
 * @param robotName - Robot name
 * @param runId - Run protocol id
 * @param setShowRunFailedModal - For closing modal
 * @param highestPriorityError - Run error information
 *
 * @returns JSX.Element | null
 */
// Note(kk:08/07/2023)
// This modal and run failed modal for Touchscreen app will be merged into one component like EstopModals.

interface RunFailedModalProps {
  robotName: string
  runId: string
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  highestPriorityError?: RunError | null
}

export function RunFailedModal({
  robotName,
  runId,
  setShowRunFailedModal,
  highestPriorityError,
}: RunFailedModalProps): JSX.Element | null {
  const { i18n, t } = useTranslation(['run_details', 'shared', 'branded'])
  const modalProps: LegacyModalProps = {
    type: 'error',
    title: t('run_failed_modal_title'),
    onClose: () => {
      setShowRunFailedModal(false)
    },
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '31.25rem',
  }
  const { downloadRunLog } = useDownloadRunLog(robotName, runId)

  if (highestPriorityError == null) return null

  const handleClick = (): void => {
    setShowRunFailedModal(false)
  }

  const handleDownloadClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
  }

  return (
    <LegacyModal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('error_info', {
            errorType: highestPriorityError.errorType,
            errorCode: highestPriorityError.errorCode,
          })}
        </LegacyStyledText>
        <Flex css={ERROR_MESSAGE_STYLE}>
          <LegacyStyledText as="p" textAlign={TYPOGRAPHY.textAlignLeft}>
            {highestPriorityError.detail}
          </LegacyStyledText>
        </Flex>
        <LegacyStyledText as="p">
          {t('branded:run_failed_modal_description_desktop')}
        </LegacyStyledText>
        <Flex
          marginTop={SPACING.spacing32}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <Link css={TYPOGRAPHY.linkPSemiBold} onClick={handleDownloadClick}>
            <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
              <Icon name="download" size="1rem" />
              {i18n.format(t('download_run_log'), 'titleCase')}
            </Flex>
          </Link>
          <PrimaryButton onClick={handleClick}>
            {i18n.format(t('shared:close'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}

const ERROR_MESSAGE_STYLE = css`
  max-height: 9.5rem;
  overflow-y: ${OVERFLOW_AUTO};
  margin-top: ${SPACING.spacing8};
  margin-bottom: ${SPACING.spacing16};
  padding: ${`${SPACING.spacing8} ${SPACING.spacing12}`};
  background-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};

  ::-webkit-scrollbar-thumb {
    background: ${COLORS.grey40};
  }
`
