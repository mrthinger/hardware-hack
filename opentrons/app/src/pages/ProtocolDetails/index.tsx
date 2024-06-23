import * as React from 'react'
import last from 'lodash/last'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_STICKY,
  SPACING,
  LegacyStyledText,
  truncateString,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useCreateRunMutation,
  useHost,
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { MAXIMUM_PINNED_PROTOCOLS } from '../../App/constants'
import { MediumButton, SmallButton, TabbedButton } from '../../atoms/buttons'
import {
  ProtocolDetailsHeaderChipSkeleton,
  ProcotolDetailsHeaderTitleSkeleton,
  ProtocolDetailsSectionContentSkeleton,
} from '../../organisms/OnDeviceDisplay/ProtocolDetails'
import { useHardwareStatusText } from '../../organisms/OnDeviceDisplay/RobotDashboard/hooks'
import { Modal, SmallModalChildren } from '../../molecules/Modal'
import { useToaster } from '../../organisms/ToasterOven'
import {
  getApplyHistoricOffsets,
  getPinnedProtocolIds,
  updateConfigValue,
  useFeatureFlag,
} from '../../redux/config'
import { useOffsetCandidatesForAnalysis } from '../../organisms/ApplyHistoricOffsets/hooks/useOffsetCandidatesForAnalysis'
import {
  useMissingProtocolHardware,
  useRunTimeParameters,
} from '../Protocols/hooks'
import { ProtocolSetupParameters } from '../../organisms/ProtocolSetupParameters'
import { Parameters } from './Parameters'
import { Deck } from './Deck'
import { Hardware } from './Hardware'
import { Labware } from './Labware'
import { Liquids } from './Liquids'
import { formatTimeWithUtcLabel } from '../../resources/runs'

import type { Protocol } from '@opentrons/api-client'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { Dispatch } from '../../redux/types'
import type { OnDeviceRouteParams } from '../../App/types'

interface ProtocolHeaderProps {
  title?: string | null
  handleRunProtocol: () => void
  chipText: string
  isScrolled: boolean
  isProtocolFetching: boolean
}

const ProtocolHeader = ({
  title,
  handleRunProtocol,
  chipText,
  isScrolled,
  isProtocolFetching,
}: ProtocolHeaderProps): JSX.Element => {
  const history = useHistory()
  const { t } = useTranslation(['protocol_info, protocol_details', 'shared'])
  const [truncate, setTruncate] = React.useState<boolean>(true)
  const [startSetup, setStartSetup] = React.useState<boolean>(false)
  const toggleTruncate = (): void => {
    setTruncate(value => !value)
  }

  let displayedTitle = title ?? null
  if (displayedTitle !== null && displayedTitle.length > 92 && truncate) {
    displayedTitle = truncateString(displayedTitle, 80, 60)
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      boxShadow={isScrolled ? BORDERS.shadowBig : undefined}
      gridGap={SPACING.spacing40}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing32} ${SPACING.spacing40}`}
      position={POSITION_STICKY}
      top="0"
      backgroundColor={COLORS.white}
      marginX={`-${SPACING.spacing32}`}
      zIndex={1} // the header is always visble when things scroll beneath
    >
      <Flex
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        width="42.125rem"
      >
        <Btn
          paddingLeft="0rem"
          paddingRight={SPACING.spacing24}
          onClick={() => {
            history.push('/protocols')
          }}
          width="3rem"
        >
          <Icon name="back" size="3rem" color={COLORS.black90} />
        </Btn>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          maxWidth="42.625rem"
        >
          <Flex maxWidth="max-content">
            {!isProtocolFetching ? (
              <Chip
                type={chipText === 'Ready to run' ? 'success' : 'warning'}
                text={chipText}
              />
            ) : (
              <ProtocolDetailsHeaderChipSkeleton />
            )}
          </Flex>
          {!isProtocolFetching ? (
            <LegacyStyledText
              as="h2"
              fontWeight={TYPOGRAPHY.fontWeightBold}
              onClick={toggleTruncate}
              overflowWrap={OVERFLOW_WRAP_ANYWHERE}
            >
              {displayedTitle}
            </LegacyStyledText>
          ) : (
            <ProcotolDetailsHeaderTitleSkeleton />
          )}
        </Flex>
      </Flex>
      <SmallButton
        buttonCategory="rounded"
        onClick={() => {
          setStartSetup(true)
          handleRunProtocol()
        }}
        buttonText={t('protocol_details:start_setup')}
        disabled={isProtocolFetching}
        iconName={startSetup ? 'ot-spinner' : undefined}
        iconPlacement="endIcon"
      />
    </Flex>
  )
}

const protocolSectionTabOptions = [
  'Summary',
  'Parameters',
  'Hardware',
  'Labware',
  'Liquids',
  'Deck',
] as const
const protocolSectionTabOptionsWithoutParameters = [
  'Summary',
  'Hardware',
  'Labware',
  'Liquids',
  'Deck',
] as const

type TabOption =
  | typeof protocolSectionTabOptions[number]
  | typeof protocolSectionTabOptionsWithoutParameters[number]

interface ProtocolSectionTabsProps {
  currentOption: TabOption
  setCurrentOption: (option: TabOption) => void
}

const ProtocolSectionTabs = ({
  currentOption,
  setCurrentOption,
}: ProtocolSectionTabsProps): JSX.Element => {
  const options = protocolSectionTabOptions

  return (
    <Flex gridGap={SPACING.spacing8}>
      {options.map(option => {
        return (
          <TabbedButton
            isSelected={option === currentOption}
            key={option}
            onClick={() => {
              setCurrentOption(option)
            }}
          >
            {option}
          </TabbedButton>
        )
      })}
    </Flex>
  )
}

interface SummaryProps {
  author: string | null
  description: string | null
  date: string | null
}

const Summary = ({ author, description, date }: SummaryProps): JSX.Element => {
  const { t, i18n } = useTranslation('protocol_details')
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing4}
      >
        <LegacyStyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >{`${i18n.format(t('author'), 'capitalize')}: `}</LegacyStyledText>
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {author}
        </LegacyStyledText>
      </Flex>
      <LegacyStyledText
        as="p"
        color={description === null ? COLORS.grey60 : undefined}
      >
        {description ?? i18n.format(t('no_summary'), 'capitalize')}
      </LegacyStyledText>
      <Flex
        backgroundColor={COLORS.grey35}
        borderRadius={BORDERS.borderRadius8}
        marginTop={SPACING.spacing24}
        width="max-content"
        padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
      >
        <LegacyStyledText as="p">{`${t('protocol_info:date_added')}: ${
          date != null ? formatTimeWithUtcLabel(date) : t('shared:no_data')
        }`}</LegacyStyledText>
      </Flex>
    </Flex>
  )
}

interface ProtocolSectionContentProps {
  protocolId: string
  protocolData?: Protocol | null
  currentOption: TabOption
}
const ProtocolSectionContent = ({
  protocolId,
  protocolData,
  currentOption,
}: ProtocolSectionContentProps): JSX.Element | null => {
  if (protocolData == null) return null

  let protocolSection: JSX.Element | null = null
  switch (currentOption) {
    case 'Summary':
      protocolSection = (
        <Summary
          author={protocolData.data.metadata.author ?? null}
          date={protocolData.data.createdAt ?? null}
          description={protocolData.data.metadata.description ?? null}
        />
      )
      break
    case 'Parameters':
      protocolSection = <Parameters protocolId={protocolId} />
      break
    case 'Hardware':
      protocolSection = <Hardware protocolId={protocolId} />
      break
    case 'Labware':
      protocolSection = <Labware protocolId={protocolId} />
      break
    case 'Liquids':
      protocolSection = <Liquids protocolId={protocolId} />
      break
    case 'Deck':
      protocolSection = <Deck protocolId={protocolId} />
      break
  }
  return (
    <Flex
      paddingTop={SPACING.spacing32}
      justifyContent={currentOption === 'Deck' ? JUSTIFY_CENTER : undefined}
    >
      {protocolSection}
    </Flex>
  )
}

export function ProtocolDetails(): JSX.Element | null {
  const { t, i18n } = useTranslation([
    'protocol_details',
    'protocol_info',
    'shared',
  ])
  const enableCsvFile = useFeatureFlag('enableCsvFile')
  const { protocolId } = useParams<OnDeviceRouteParams>()
  const {
    missingProtocolHardware,
    conflictedSlots,
  } = useMissingProtocolHardware(protocolId)
  let chipText = useHardwareStatusText(missingProtocolHardware, conflictedSlots)

  const runTimeParameters = useRunTimeParameters(protocolId)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const host = useHost()
  const { makeSnackbar } = useToaster()
  const [showParameters, setShowParameters] = React.useState<boolean>(false)
  const queryClient = useQueryClient()
  const [currentOption, setCurrentOption] = React.useState<TabOption>(
    protocolSectionTabOptions[0]
  )

  const [showMaxPinsAlert, setShowMaxPinsAlert] = React.useState<boolean>(false)
  const {
    data: protocolRecord,
    isLoading: isProtocolFetching,
  } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  // Watch for scrolling to toggle dropshadow
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false)
  const observer = new IntersectionObserver(([entry]) => {
    setIsScrolled(!entry.isIntersecting)
  })
  if (scrollRef.current != null) {
    observer.observe(scrollRef.current)
  }

  let pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const pinned = pinnedProtocolIds.includes(protocolId)

  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolRecord?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolRecord != null }
  )

  const shouldApplyOffsets = useSelector(getApplyHistoricOffsets)
  // I'd love to skip scraping altogether if we aren't applying
  // conditional offsets, but React won't let us use hooks conditionally.
  // So, we'll scrape regardless and just toss them if we don't need them.
  const scrapedLabwareOffsets = useOffsetCandidatesForAnalysis(
    mostRecentAnalysis ?? null
  ).map(({ vector, location, definitionUri }) => ({
    vector,
    location,
    definitionUri,
  }))
  const labwareOffsets = shouldApplyOffsets ? scrapedLabwareOffsets : []

  const { createRun } = useCreateRunMutation({
    onSuccess: data => {
      queryClient.invalidateQueries([host, 'runs']).catch((e: Error) => {
        console.error(`could not invalidate runs cache: ${e.message}`)
      })
    },
  })

  const isRequiredCsv =
    mostRecentAnalysis?.result === 'parameter-value-required'
  if (enableCsvFile && isRequiredCsv) {
    if (chipText === 'Ready to run') {
      chipText = i18n.format(t('requires_csv'), 'capitalize')
    } else {
      chipText = `${chipText} & ${t('requires_csv')}`
    }
  }

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedProtocolIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedProtocolIds.push(protocolId)
        makeSnackbar(t('protocol_info:pinned_protocol') as string)
      }
    } else {
      pinnedProtocolIds = pinnedProtocolIds.filter(p => p !== protocolId)
      makeSnackbar(t('protocol_info:unpinned_protocol') as string)
    }
    dispatch(
      updateConfigValue('protocols.pinnedProtocolIds', pinnedProtocolIds)
    )
  }
  const handleRunProtocol = (): void => {
    runTimeParameters.length > 0
      ? setShowParameters(true)
      : createRun({ protocolId, labwareOffsets })
  }
  const [
    showConfirmDeleteProtocol,
    setShowConfirmationDeleteProtocol,
  ] = React.useState<boolean>(false)

  const handleDeleteClick = (): void => {
    setShowConfirmationDeleteProtocol(false)
    if (host != null) {
      getProtocol(host, protocolId)
        .then(
          response =>
            response.data.links?.referencingRuns.map(({ id }) => id) ?? []
        )
        .then(referencingRunIds =>
          Promise.all(referencingRunIds?.map(runId => deleteRun(host, runId)))
        )
        .then(() => deleteProtocol(host, protocolId))
        .then(() => {
          history.push('/protocols')
        })
        .catch((e: Error) => {
          console.error(`error deleting resources: ${e.message}`)
          history.push('/protocols')
        })
    } else {
      console.error(
        'could not delete resources because the robot host is unknown'
      )
    }
  }

  const displayName =
    !isProtocolFetching && protocolRecord != null
      ? protocolRecord?.data.metadata.protocolName ??
        protocolRecord?.data.files[0].name
      : null

  const deleteModalHeader: ModalHeaderBaseProps = {
    title: 'Delete this protocol?',
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  return showParameters ? (
    <ProtocolSetupParameters
      protocolId={protocolId}
      labwareOffsets={labwareOffsets}
      runTimeParameters={runTimeParameters}
    />
  ) : (
    <>
      {showConfirmDeleteProtocol ? (
        <Flex alignItems={ALIGN_CENTER}>
          {!isProtocolFetching ? (
            <Modal
              modalSize="medium"
              onOutsideClick={() => {
                setShowConfirmationDeleteProtocol(false)
              }}
              header={deleteModalHeader}
            >
              <Flex flexDirection={DIRECTION_COLUMN} width="100%">
                <LegacyStyledText
                  as="h4"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  marginBottom={SPACING.spacing40}
                >
                  {t('delete_protocol_perm', { name: displayName })}
                </LegacyStyledText>
                <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
                  <SmallButton
                    onClick={() => {
                      setShowConfirmationDeleteProtocol(false)
                    }}
                    buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
                    width="50%"
                  />
                  <SmallButton
                    onClick={handleDeleteClick}
                    buttonText={t('shared:delete')}
                    buttonType="alert"
                    width="50%"
                  />
                </Flex>
              </Flex>
            </Modal>
          ) : null}
        </Flex>
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing40}
        paddingBottom={SPACING.spacing40}
      >
        {showMaxPinsAlert && (
          <SmallModalChildren
            header={t('too_many_pins_header')}
            subText={t('too_many_pins_body')}
            buttonText={i18n.format(t('shared:close'), 'capitalize')}
            handleCloseMaxPinsAlert={() => {
              setShowMaxPinsAlert(false)
            }}
          />
        )}
        {/* Empty box to detect scrolling */}
        <Flex ref={scrollRef} />
        <ProtocolHeader
          title={displayName}
          handleRunProtocol={handleRunProtocol}
          chipText={chipText}
          isScrolled={isScrolled}
          isProtocolFetching={isProtocolFetching}
        />
        <Flex flexDirection={DIRECTION_COLUMN}>
          <ProtocolSectionTabs
            currentOption={currentOption}
            setCurrentOption={setCurrentOption}
          />
          {!isProtocolFetching ? (
            <ProtocolSectionContent
              protocolId={protocolId}
              protocolData={protocolRecord}
              currentOption={currentOption}
            />
          ) : (
            <ProtocolDetailsSectionContentSkeleton />
          )}
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing8}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            paddingTop={
              // Skeleton is large. Better UX not to scroll to see buttons while loading.
              !isProtocolFetching ? SPACING.spacing60 : SPACING.spacing24
            }
          >
            <MediumButton
              buttonText={
                pinned
                  ? t('protocol_info:unpin_protocol')
                  : t('protocol_info:pin_protocol')
              }
              buttonType="secondary"
              iconName="pin"
              onClick={handlePinClick}
              width="100%"
            />
            <MediumButton
              buttonText={t('protocol_info:delete_protocol')}
              buttonType="alertSecondary"
              iconName="trash"
              onClick={() => {
                setShowConfirmationDeleteProtocol(true)
              }}
              width="100%"
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
