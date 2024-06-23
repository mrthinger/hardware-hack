import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { formatDistance } from 'date-fns'
import styled, { css } from 'styled-components'

import {
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  TYPOGRAPHY,
  useLongPress,
  LegacyStyledText,
} from '@opentrons/components'

import { LongPressModal } from './LongPressModal'
import { formatTimeWithUtcLabel } from '../../resources/runs'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export type CardSizeType = 'full' | 'half' | 'regular'

const cardStyleBySize: {
  [s in CardSizeType]: {
    fontSize: string
    height: string
    lineHeight: string
    fontWeight: number
    width: string
  }
} = {
  full: {
    fontSize: TYPOGRAPHY.fontSize32,
    height: '8.875rem',
    lineHeight: TYPOGRAPHY.lineHeight42,
    fontWeight: TYPOGRAPHY.fontWeightBold,
    width: '59rem',
  },
  half: {
    fontSize: TYPOGRAPHY.fontSize28,
    height: '10.75rem',
    lineHeight: TYPOGRAPHY.lineHeight36,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    width: '29.25rem',
  },
  regular: {
    fontSize: TYPOGRAPHY.fontSize28,
    height: '10.75rem',
    lineHeight: TYPOGRAPHY.lineHeight36,
    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
    width: '28.375rem',
  },
}

export function PinnedProtocol(props: {
  protocol: ProtocolResource
  longPress: React.Dispatch<React.SetStateAction<boolean>>
  cardSize?: CardSizeType
  lastRun?: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetProtocolId: (targetProtocolId: string) => void
}): JSX.Element {
  const {
    lastRun,
    protocol,
    longPress,
    setShowDeleteConfirmationModal,
    setTargetProtocolId,
  } = props
  const cardSize = props.cardSize ?? 'full'
  const history = useHistory()
  const longpress = useLongPress()
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const { t } = useTranslation('protocol_info')

  const handleProtocolClick = (
    longpress: UseLongPressResult,
    protocolId: string
  ): void => {
    if (!longpress.isLongPressed) {
      history.push(`/protocols/${protocolId}`)
    }
  }
  React.useEffect(() => {
    if (longpress.isLongPressed) {
      longPress(true)
    }
  }, [longpress.isLongPressed, longPress])

  const PUSHED_STATE_STYLE = css`
    &:active {
      background-color: ${longpress.isLongPressed ? '' : COLORS.grey50};
    }
  `

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadius16}
      css={PUSHED_STATE_STYLE}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing24}
      height={cardStyleBySize[cardSize].height}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      maxWidth={cardStyleBySize[cardSize].width}
      minWidth={cardStyleBySize[cardSize].width}
      onClick={() => {
        handleProtocolClick(longpress, protocol.id)
      }}
      overflowWrap={OVERFLOW_WRAP_ANYWHERE}
      padding={SPACING.spacing24}
      ref={longpress.ref}
    >
      <ProtocolNameText
        cardSize={cardSize}
        fontSize={cardStyleBySize[cardSize].fontSize}
        fontWeight={cardStyleBySize[cardSize].fontWeight}
        lineHeight={cardStyleBySize[cardSize].lineHeight}
      >
        {protocolName}
      </ProtocolNameText>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing8}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="100%"
        color={COLORS.grey60}
      >
        <LegacyStyledText as="p">
          {lastRun !== undefined
            ? `${formatDistance(new Date(lastRun), new Date(), {
                addSuffix: true,
              }).replace('about ', '')}`
            : t('no_history')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {formatTimeWithUtcLabel(protocol.createdAt)}
        </LegacyStyledText>
      </Flex>
      {longpress.isLongPressed && (
        <LongPressModal
          longpress={longpress}
          protocolId={protocol.id}
          setTargetProtocolId={setTargetProtocolId}
          setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
        />
      )}
    </Flex>
  )
}

const ProtocolNameText = styled(LegacyStyledText)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${(props: { cardSize: CardSizeType }) =>
    props.cardSize === 'full' ? 1 : 2};
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_ANYWHERE};
  font-size: ${(props: { cardSize: CardSizeType }) =>
    cardStyleBySize[props.cardSize].fontSize};
  font-weight: ${(props: { cardSize: CardSizeType }) =>
    cardStyleBySize[props.cardSize].fontWeight};
  line-height: ${(props: { cardSize: CardSizeType }) =>
    cardStyleBySize[props.cardSize].lineHeight};
`
