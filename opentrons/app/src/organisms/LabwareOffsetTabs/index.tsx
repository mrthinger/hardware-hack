import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RoundTab,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

type TabOptions = 'table' | 'jupyter' | 'cli'

export interface LabwareOffsetTabsProps extends StyleProps {
  TableComponent: JSX.Element
  JupyterComponent: JSX.Element
  CommandLineComponent: JSX.Element
}

export function LabwareOffsetTabs({
  TableComponent,
  JupyterComponent,
  CommandLineComponent,
  ...styleProps
}: LabwareOffsetTabsProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const [currentTab, setCurrentTab] = React.useState<TabOptions>('table')

  const activeTabComponent = {
    table: TableComponent,
    jupyter: JupyterComponent,
    cli: CommandLineComponent,
  }
  return (
    <Flex
      width="100%"
      height="100%"
      flexDirection={DIRECTION_COLUMN}
      {...styleProps}
    >
      <Flex gridGap={SPACING.spacing4} marginY={SPACING.spacing8}>
        <RoundTab
          isCurrent={currentTab === 'table'}
          onClick={() => {
            setCurrentTab('table')
          }}
        >
          <LegacyStyledText>{t('table_view')}</LegacyStyledText>
        </RoundTab>
        <RoundTab
          isCurrent={currentTab === 'jupyter'}
          onClick={() => {
            setCurrentTab('jupyter')
          }}
        >
          <LegacyStyledText>{t('jupyter_notebook')}</LegacyStyledText>
        </RoundTab>
        <RoundTab
          isCurrent={currentTab === 'cli'}
          onClick={() => {
            setCurrentTab('cli')
          }}
        >
          <LegacyStyledText>{t('cli_ssh')}</LegacyStyledText>
        </RoundTab>
      </Flex>
      <Box
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        // remove left upper corner border radius when first tab is active
        borderRadius={`${
          currentTab === 'table' ? '0' : BORDERS.borderRadius4
        } ${BORDERS.borderRadius4} ${BORDERS.borderRadius4} ${
          BORDERS.borderRadius4
        }`}
        paddingX={SPACING.spacing16}
      >
        {activeTabComponent[currentTab]}
      </Box>
    </Flex>
  )
}
