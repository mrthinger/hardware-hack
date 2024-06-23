import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import { MICRO_LITERS } from '@opentrons/shared-data'
import { ODDBackButton } from '../../molecules/ODDBackButton'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getTotalVolumePerLiquidId } from '../Devices/ProtocolRun/SetupLiquids/utils'
import { LiquidDetails } from './LiquidDetails'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { ParsedLiquid } from '@opentrons/api-client'
import type { SetupScreens } from '../../pages/ProtocolSetup'

export interface ProtocolSetupLiquidsProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupLiquids({
  runId,
  setSetupScreen,
}: ProtocolSetupLiquidsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const liquidsInLoadOrder = parseLiquidsInLoadOrder(
    protocolData?.liquids ?? [],
    protocolData?.commands ?? []
  )
  return (
    <>
      <ODDBackButton
        label={t('liquids')}
        onClick={() => {
          setSetupScreen('prepare to run')
        }}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop="2.375rem"
      >
        {liquidsInLoadOrder?.map(liquid => (
          <React.Fragment key={liquid.id}>
            <LiquidsList
              liquid={liquid}
              commands={protocolData?.commands}
              runId={runId}
            />
          </React.Fragment>
        ))}
      </Flex>
    </>
  )
}

interface LiquidsListProps {
  liquid: ParsedLiquid
  runId: string
  commands?: RunTimeCommand[]
}

export function LiquidsList(props: LiquidsListProps): JSX.Element {
  const { liquid, runId, commands } = props
  const [openItem, setOpenItem] = React.useState(false)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands ?? [])

  return (
    <Flex
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadius16}
      fontSize={TYPOGRAPHY.fontSize22}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing24}
      width="100%"
    >
      <Flex
        alignItems={ALIGN_CENTER}
        width="100%"
        gridGap={SPACING.spacing16}
        onClick={() => {
          setOpenItem(prevOpenItem => !prevOpenItem)
        }}
        aria-label={`Liquids_${liquid.id}`}
      >
        <Flex
          borderRadius={BORDERS.borderRadius8}
          padding={SPACING.spacing16}
          backgroundColor={COLORS.white}
          height="3.75rem"
          width="3.75rem"
        >
          <Icon
            name="circle"
            color={liquid.displayColor}
            aria-label={`Liquids_${liquid.displayColor}`}
            size="1.75rem"
          />
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={TYPOGRAPHY.textAlignCenter}
        >
          <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {liquid.displayName}
          </LegacyStyledText>
        </Flex>
        <Flex justifyContent={JUSTIFY_FLEX_END} flex="1">
          <Flex
            backgroundColor={COLORS.grey35}
            borderRadius={BORDERS.borderRadius4}
            height="2.75rem"
            padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
            alignItems={TYPOGRAPHY.textAlignCenter}
            marginRight={SPACING.spacing8}
          >
            {getTotalVolumePerLiquidId(liquid.id, labwareByLiquidId)}{' '}
            {MICRO_LITERS}
          </Flex>
        </Flex>
        <Icon name={openItem ? 'chevron-up' : 'chevron-right'} size="3rem" />
      </Flex>
      {openItem ? (
        <LiquidDetails
          runId={runId}
          liquid={liquid}
          commands={commands}
          labwareByLiquidId={labwareByLiquidId}
        />
      ) : null}
    </Flex>
  )
}
