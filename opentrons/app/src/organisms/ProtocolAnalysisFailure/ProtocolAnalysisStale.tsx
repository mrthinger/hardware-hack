import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP_REVERSE,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'

import type { Dispatch } from '../../redux/types'
import { analyzeProtocol } from '../../redux/protocol-storage'
interface ProtocolAnalysisStaleProps {
  protocolKey: string
}

export function ProtocolAnalysisStale(
  props: ProtocolAnalysisStaleProps
): JSX.Element {
  const { protocolKey } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const dispatch = useDispatch<Dispatch>()

  const handleClickReanalyze: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(analyzeProtocol(protocolKey))
  }
  return (
    <Banner type="warning" marginRight={SPACING.spacing24}>
      <Flex
        columnGap={SPACING.spacing8}
        flex="1"
        flexWrap={WRAP_REVERSE}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        width="100%"
      >
        <LegacyStyledText as="p">
          {t('protocol_analysis_outdated')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          <Trans
            t={t}
            i18nKey="reanalyze_to_view"
            components={{
              analysisLink: (
                <Btn
                  as="a"
                  role="button"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={handleClickReanalyze}
                />
              ),
            }}
          />
        </LegacyStyledText>
      </Flex>
    </Banner>
  )
}
