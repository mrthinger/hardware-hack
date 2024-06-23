import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  POSITION_STATIC,
  POSITION_STICKY,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { SmallButton, FloatingActionButton } from '../../atoms/buttons'
import { Navigation } from '../../organisms/Navigation'
import {
  getPinnedProtocolIds,
  getProtocolsOnDeviceSortKey,
  updateConfigValue,
  useFeatureFlag,
} from '../../redux/config'
import { PinnedProtocolCarousel } from './PinnedProtocolCarousel'
import { sortProtocols } from './utils'
import { ProtocolCard } from './ProtocolCard'
import { NoProtocols } from './NoProtocols'
import { DeleteProtocolConfirmationModal } from './DeleteProtocolConfirmationModal'
import { useNotifyAllRunsQuery } from '../../resources/runs'

import type { Dispatch } from '../../redux/types'
import type { ProtocolsOnDeviceSortKey } from '../../redux/config/types'
import type { ProtocolResource } from '@opentrons/shared-data'

export function ProtocolDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const runs = useNotifyAllRunsQuery()
  const history = useHistory()
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const [navMenuIsOpened, setNavMenuIsOpened] = React.useState<boolean>(false)
  const [
    longPressModalIsOpened,
    setLongPressModalOpened,
  ] = React.useState<boolean>(false)
  const [
    showDeleteConfirmationModal,
    setShowDeleteConfirmationModal,
  ] = React.useState<boolean>(false)
  const [targetProtocolId, setTargetProtocolId] = React.useState<string>('')
  const sortBy = useSelector(getProtocolsOnDeviceSortKey) ?? 'alphabetical'
  const protocolsData = protocols.data?.data ?? []
  let unpinnedProtocols: ProtocolResource[] = protocolsData

  // The pinned protocols are stored as an array of IDs in config
  const pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const pinnedProtocols: ProtocolResource[] = []

  // TODO(sb, 4/15/24): The quick transfer button is going to be moved to a new quick transfer
  // tab before the feature is released. Because of this, we're not adding test cov
  // for this button in ProtocolDashboard
  const enableQuickTransferFF = useFeatureFlag('enableQuickTransfer')

  // We only need to grab out the pinned protocol data once all the protocols load
  // and if we have pinned ids stored in config.
  if (protocolsData.length > 0 && pinnedProtocolIds.length > 0) {
    // First: if they're not in the list, they're not pinned.
    unpinnedProtocols = protocolsData.filter(
      p => !pinnedProtocolIds.includes(p.id)
    )
    // We want an array of protocols in the same order as the
    // array of IDs we stored. There are many ways to sort
    // the pinned protocols. This way is mine.
    //
    // Also, while we're here...
    // It's possible (here in the early days while running a simulator, anyway)
    // to lose protocols locally but still have their IDs in the pinned config.
    // If that happens, there's no way to unpin them so let's sync the config
    // back up with the actual protocols we have on hand.
    const missingIds: string[] = []
    for (const id of pinnedProtocolIds) {
      const protocol = protocolsData.find(p => p.id === id)
      if (protocol !== undefined) {
        pinnedProtocols.push(protocol)
      } else {
        missingIds.push(id)
      }
    }

    // Here's where we'll fix the config if we need to.
    if (missingIds.length > 0) {
      const actualPinnedIds = pinnedProtocolIds.filter(
        id => !missingIds.includes(id)
      )
      dispatch(
        updateConfigValue('protocols.pinnedProtocolIds', actualPinnedIds)
      )
    }
  }

  const runData = runs.data?.data != null ? runs.data?.data : []
  const allRunsNewestFirst = runData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const sortedProtocols = sortProtocols(
    sortBy,
    unpinnedProtocols,
    allRunsNewestFirst
  )
  const handleProtocolsBySortKey = (
    sortKey: ProtocolsOnDeviceSortKey
  ): void => {
    dispatch(updateConfigValue('protocols.protocolsOnDeviceSortKey', sortKey))
  }

  const handleSortByName = (): void => {
    if (sortBy === 'alphabetical') {
      handleProtocolsBySortKey('reverse')
    } else {
      handleProtocolsBySortKey('alphabetical')
    }
  }

  const handleSortByLastRun = (): void => {
    if (sortBy === 'recentRun') {
      handleProtocolsBySortKey('oldRun')
    } else {
      handleProtocolsBySortKey('recentRun')
    }
  }

  const handleSortByDate = (): void => {
    if (sortBy === 'recentCreated') {
      handleProtocolsBySortKey('oldCreated')
    } else {
      handleProtocolsBySortKey('recentCreated')
    }
  }

  return (
    <>
      {showDeleteConfirmationModal ? (
        <DeleteProtocolConfirmationModal
          protocolId={targetProtocolId}
          setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        minHeight="25rem"
        paddingBottom={SPACING.spacing40}
      >
        <Navigation
          setNavMenuIsOpened={setNavMenuIsOpened}
          longPressModalIsOpened={longPressModalIsOpened}
        />
        <Box paddingX={SPACING.spacing40}>
          {pinnedProtocols.length > 0 && (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginBottom={SPACING.spacing32}
            >
              <LegacyStyledText
                as="p"
                marginBottom={SPACING.spacing8}
                color={COLORS.grey60}
              >
                {t('pinned_protocols')}
              </LegacyStyledText>
              <PinnedProtocolCarousel
                pinnedProtocols={pinnedProtocols}
                longPress={setLongPressModalOpened}
                setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
                setTargetProtocolId={setTargetProtocolId}
              />
            </Flex>
          )}
          {sortedProtocols.length > 0 ? (
            <>
              <Flex
                alignItems={ALIGN_CENTER}
                backgroundColor={COLORS.white}
                flexDirection={DIRECTION_ROW}
                paddingBottom={SPACING.spacing16}
                position={
                  navMenuIsOpened || longPressModalIsOpened
                    ? POSITION_STATIC
                    : POSITION_STICKY
                }
                top="7.75rem"
                zIndex={navMenuIsOpened || longPressModalIsOpened ? 0 : 3}
                width="100%"
              >
                <Flex width="32.3125rem">
                  <SmallButton
                    buttonText={t('protocol_name_title')}
                    buttonType={
                      sortBy === 'alphabetical' || sortBy === 'reverse'
                        ? 'secondary'
                        : 'tertiaryLowLight'
                    }
                    iconName={
                      sortBy === 'alphabetical' || sortBy === 'reverse'
                        ? sortBy === 'alphabetical'
                          ? 'arrow-down'
                          : 'arrow-up'
                        : undefined
                    }
                    iconPlacement="endIcon"
                    onClick={handleSortByName}
                  />
                </Flex>
                <Flex width="12rem">
                  <SmallButton
                    buttonText={t('last_run')}
                    buttonType={
                      sortBy === 'recentRun' || sortBy === 'oldRun'
                        ? 'secondary'
                        : 'tertiaryLowLight'
                    }
                    iconName={
                      sortBy === 'recentRun' || sortBy === 'oldRun'
                        ? sortBy === 'recentRun'
                          ? 'arrow-down'
                          : 'arrow-up'
                        : undefined
                    }
                    iconPlacement="endIcon"
                    onClick={handleSortByLastRun}
                  />
                </Flex>
                <Flex width="14.625rem">
                  <SmallButton
                    buttonText={t('date_added')}
                    buttonType={
                      sortBy === 'recentCreated' || sortBy === 'oldCreated'
                        ? 'secondary'
                        : 'tertiaryLowLight'
                    }
                    iconName={
                      sortBy === 'recentCreated' || sortBy === 'oldCreated'
                        ? sortBy === 'recentCreated'
                          ? 'arrow-down'
                          : 'arrow-up'
                        : undefined
                    }
                    iconPlacement="endIcon"
                    onClick={handleSortByDate}
                  />
                </Flex>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN}>
                {sortedProtocols.map(protocol => {
                  const lastRun = runs.data?.data.find(
                    run => run.protocolId === protocol.id
                  )?.createdAt

                  return (
                    <ProtocolCard
                      key={protocol.id}
                      lastRun={lastRun}
                      protocol={protocol}
                      longPress={setLongPressModalOpened}
                      setShowDeleteConfirmationModal={
                        setShowDeleteConfirmationModal
                      }
                      setTargetProtocolId={setTargetProtocolId}
                    />
                  )
                })}
              </Flex>
            </>
          ) : pinnedProtocols.length === 0 ? (
            <NoProtocols />
          ) : null}
        </Box>
      </Flex>
      {enableQuickTransferFF && (
        <FloatingActionButton
          buttonText={t('quick_transfer')}
          iconName="plus"
          onClick={() => {
            history.push('/quick-transfer')
          }}
        />
      )}
    </>
  )
}
