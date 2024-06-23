import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ChildNavigation } from '../../organisms/ChildNavigation'
import { ROBOT_ANALYTICS_SETTING_ID } from '../../pages/RobotDashboard/AnalyticsOptInModal'
import { RobotSettingButton } from '../../pages/RobotSettingsDashboard/RobotSettingButton'
import { OnOffToggle } from '../../pages/RobotSettingsDashboard/RobotSettingsList'
import {
  getAnalyticsOptedIn,
  toggleAnalyticsOptedIn,
} from '../../redux/analytics'
import { getRobotSettings, updateSetting } from '../../redux/robot-settings'

import type { Dispatch, State } from '../../redux/types'
import type { SetSettingOption } from '../../pages/RobotSettingsDashboard'

interface PrivacyProps {
  robotName: string
  setCurrentOption: SetSettingOption
}

export function Privacy({
  robotName,
  setCurrentOption,
}: PrivacyProps): JSX.Element {
  const { t } = useTranslation(['app_settings', 'branded'])
  const dispatch = useDispatch<Dispatch>()

  const allRobotSettings = useSelector((state: State) =>
    getRobotSettings(state, robotName)
  )

  const appAnalyticsOptedIn = useSelector(getAnalyticsOptedIn)

  const isRobotAnalyticsDisabled =
    allRobotSettings.find(({ id }) => id === ROBOT_ANALYTICS_SETTING_ID)
      ?.value ?? false

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('app_settings:privacy')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        paddingX={SPACING.spacing40}
        marginTop="7.75rem"
      >
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {t('branded:opentrons_cares_about_privacy')}
        </LegacyStyledText>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <RobotSettingButton
            settingName={t('share_robot_logs')}
            settingInfo={t('share_robot_logs_description')}
            dataTestId="RobotSettingButton_share_analytics"
            rightElement={<OnOffToggle isOn={!isRobotAnalyticsDisabled} />}
            onClick={() =>
              dispatch(
                updateSetting(
                  robotName,
                  ROBOT_ANALYTICS_SETTING_ID,
                  !isRobotAnalyticsDisabled
                )
              )
            }
          />
          <RobotSettingButton
            settingName={t('share_display_usage')}
            settingInfo={t('branded:share_display_usage_description')}
            dataTestId="RobotSettingButton_share_app_analytics"
            rightElement={<OnOffToggle isOn={appAnalyticsOptedIn} />}
            onClick={() => dispatch(toggleAnalyticsOptedIn())}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
