import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useHost, useProtocolQuery } from '@opentrons/react-api-client'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { useToaster } from '../../organisms/ToasterOven'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface DeleteProtocolConfirmationModalProps {
  protocolId: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
}

export function DeleteProtocolConfirmationModal({
  protocolId,
  setShowDeleteConfirmationModal,
}: DeleteProtocolConfirmationModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['protocol_list', 'shared'])
  const { makeSnackbar } = useToaster()
  const [showIcon, setShowIcon] = React.useState<boolean>(false)
  const modalHeader: ModalHeaderBaseProps = {
    title: t('delete_this_protocol'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: protocolRecord } = useProtocolQuery(protocolId)
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  const handleCloseModal = (): void => {
    setShowDeleteConfirmationModal(false)
  }
  const handleDeleteProtocol = (): void => {
    if (host != null && protocolId != null) {
      setShowIcon(true)
      getProtocol(host, protocolId)
        .then(
          response =>
            response.data.links?.referencingRuns.map(({ id }) => id) ?? []
        )
        .then(referencingRunIds => {
          return Promise.all(
            referencingRunIds?.map(runId => deleteRun(host, runId))
          )
        })
        .then(() => deleteProtocol(host, protocolId))
        .then(() =>
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) => {
              console.error(`error invalidating runs query: ${e.message}`)
            })
        )
        .then(() => {
          setShowIcon(false)
          setShowDeleteConfirmationModal(false)
          makeSnackbar(t('protocol_deleted') as string)
        })
        .catch((e: Error) => {
          console.error(`error deleting resources: ${e.message}`)
        })
    } else {
      console.error(
        'could not delete resources because the robot host is unknown'
      )
    }
  }
  return (
    <Modal header={modalHeader}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Box width="100%">
          <ProtocolNameText>{protocolName}</ProtocolNameText>
          <AdditionalText>{t('delete_protocol_message')}</AdditionalText>
        </Box>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            flex="1"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={handleCloseModal}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('shared:delete')}
            onClick={handleDeleteProtocol}
            iconPlacement={showIcon ? 'startIcon' : undefined}
            iconName={showIcon ? 'ot-spinner' : undefined}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}

const ProtocolNameText = styled.span`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.grey60};
`
const AdditionalText = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  color: ${COLORS.grey60};
`
