import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LabwareRender,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Modal } from '../../../../molecules/Modal'
import { getIsOnDevice } from '../../../../redux/config'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { getLocationInfoNames } from '../utils/getLocationInfoNames'
import { getSlotLabwareDefinition } from '../utils/getSlotLabwareDefinition'
import { LiquidDetailCard } from './LiquidDetailCard'
import {
  getLiquidsByIdForLabware,
  getDisabledWellFillFromLabwareId,
  getWellGroupForLiquidId,
  getDisabledWellGroupForLiquidId,
} from './utils'

interface LiquidsLabwareDetailsModalProps {
  liquidId?: string
  labwareId: string
  runId: string
  closeModal: () => void
}

export const LiquidsLabwareDetailsModal = (
  props: LiquidsLabwareDetailsModalProps
): JSX.Element | null => {
  const { liquidId, labwareId, runId, closeModal } = props
  const { t } = useTranslation('protocol_setup')
  const isOnDevice = useSelector(getIsOnDevice)
  const currentLiquidRef = React.useRef<HTMLDivElement>(null)
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const commands = protocolData?.commands ?? []
  const liquids = parseLiquidsInLoadOrder(
    protocolData?.liquids != null ? protocolData?.liquids : [],
    commands
  )
  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands)
  const labwareInfo = getLiquidsByIdForLabware(labwareId, labwareByLiquidId)
  const { slotName, labwareName } = getLocationInfoNames(labwareId, commands)
  const loadLabwareCommand = commands
    ?.filter(command => command.commandType === 'loadLabware')
    ?.find(command => command.result?.labwareId === labwareId)
  const labwareWellOrdering = loadLabwareCommand?.result?.definition?.ordering
  const filteredLiquidsInLoadOrder = liquids.filter(liquid => {
    return Object.keys(labwareInfo).some(key => key === liquid.id)
  })
  const [selectedValue, setSelectedValue] = React.useState<typeof liquidId>(
    liquidId ?? filteredLiquidsInLoadOrder[0].id
  )

  const wellFill = getDisabledWellFillFromLabwareId(
    labwareId,
    liquids,
    labwareByLiquidId,
    selectedValue
  )

  const scrollToCurrentItem = (): void => {
    currentLiquidRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  React.useEffect(() => {
    scrollToCurrentItem()
  }, [])
  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `
  if (protocolData == null) return null
  const liquidIds = filteredLiquidsInLoadOrder.map(liquid => liquid.id)
  const disabledLiquidIds = liquidIds.filter(id => id !== selectedValue)
  const labwareRender = (
    <LabwareRender
      definition={getSlotLabwareDefinition(labwareId, protocolData.commands)}
      wellFill={wellFill}
      wellLabelOption="SHOW_LABEL_INSIDE"
      highlightedWells={
        selectedValue != null
          ? getWellGroupForLiquidId(labwareInfo, selectedValue)
          : {}
      }
      disabledWells={getDisabledWellGroupForLiquidId(
        labwareInfo,
        disabledLiquidIds
      )}
    />
  )
  const liquidCard = filteredLiquidsInLoadOrder.map(liquid => {
    const labwareInfoEntry = Object.entries(labwareInfo).find(
      entry => entry[0] === liquid.id
    )
    return (
      labwareInfoEntry != null && (
        <Flex
          width="100%"
          key={liquid.id}
          ref={selectedValue === liquid.id ? currentLiquidRef : undefined}
        >
          <LiquidDetailCard
            {...liquid}
            liquidId={liquid.id}
            volumeByWell={labwareInfoEntry[1][0].volumeByWell}
            labwareWellOrdering={labwareWellOrdering}
            setSelectedValue={setSelectedValue}
            selectedValue={selectedValue}
          />
        </Flex>
      )
    )
  })

  return isOnDevice ? (
    <Modal
      modalSize="large"
      onOutsideClick={closeModal}
      header={{
        title: labwareName,
        hasExitIcon: true,
        onClick: closeModal,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        height="23.70375rem"
        css={HIDE_SCROLLBAR}
        minWidth="10.313rem"
        overflowY="scroll"
        gridGap={SPACING.spacing16}
      >
        {liquidCard}
      </Flex>
      <Flex width="38.75rem">
        <Flex marginLeft={SPACING.spacing32}>
          <svg
            viewBox="0.5 2.2 127 78"
            height="100%"
            width="100%"
            transform="scale(1, -1)"
          >
            {labwareRender}
          </svg>
        </Flex>
      </Flex>
    </Modal>
  ) : (
    <LegacyModal
      onClose={closeModal}
      closeOnOutsideClick
      title={labwareName}
      childrenPadding={0}
      width="45rem"
    >
      <Box
        paddingX={SPACING.spacing16}
        paddingTop={SPACING.spacing16}
        backgroundColor={COLORS.grey10}
        height="28.125rem"
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            maxHeight="27.125rem"
            overflowY="auto"
            css={HIDE_SCROLLBAR}
            minWidth="10.313rem"
            gridGap={SPACING.spacing8}
          >
            {liquidCard}
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            width="100%"
            maxHeight="25rem"
            marginLeft={SPACING.spacing16}
            marginTop={SPACING.spacing8}
          >
            <Flex flexDirection={DIRECTION_ROW}>
              <Flex flexDirection={DIRECTION_COLUMN}>
                <LegacyStyledText
                  as="h6"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.grey50}
                >
                  {t('slot_number')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.black90}
                >
                  {slotName}
                </LegacyStyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginLeft={SPACING.spacing24}
              >
                <LegacyStyledText
                  as="h6"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.grey50}
                >
                  {t('labware_name')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.black90}
                >
                  {labwareName}
                </LegacyStyledText>
              </Flex>
            </Flex>
            <Flex flex="1 1 30rem" flexDirection={DIRECTION_COLUMN}>
              <svg viewBox="0 -10 130 100" transform="scale(1, -1)">
                {labwareRender}
              </svg>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </LegacyModal>
  )
}
