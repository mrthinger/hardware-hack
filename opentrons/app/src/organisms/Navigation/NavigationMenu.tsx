import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { home, ROBOT } from '../../redux/robot-controls'
import { useLights } from '../Devices/hooks'
import { RestartRobotConfirmationModal } from './RestartRobotConfirmationModal'

import type { Dispatch } from '../../redux/types'

interface NavigationMenuProps {
  onClick: React.MouseEventHandler
  robotName: string
  setShowNavMenu: (showNavMenu: boolean) => void
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const { onClick, robotName, setShowNavMenu } = props
  const { t, i18n } = useTranslation(['devices_landing', 'robot_controls'])
  const { lightsOn, toggleLights } = useLights()
  const dispatch = useDispatch<Dispatch>()
  const [
    showRestartRobotConfirmationModal,
    setShowRestartRobotConfirmationModal,
  ] = React.useState<boolean>(false)

  const history = useHistory()

  const handleRestart = (): void => {
    setShowRestartRobotConfirmationModal(true)
  }

  const handleHomeGantry = (): void => {
    dispatch(home(robotName, ROBOT))
    setShowNavMenu(false)
  }

  // ToDo (kk:10/02/2023)
  // Need to update a function for onClick
  return (
    <>
      {showRestartRobotConfirmationModal ? (
        <RestartRobotConfirmationModal
          robotName={robotName}
          setShowRestartRobotConfirmationModal={
            setShowRestartRobotConfirmationModal
          }
        />
      ) : null}
      <MenuList onClick={onClick} isOnDevice={true}>
        <MenuItem key="reset-position" onClick={handleHomeGantry}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="reset-position"
              aria-label="reset-position_icon"
              size="2.5rem"
            />
            <LegacyStyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('home_gantry')}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="restart" onClick={handleRestart}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="restart"
              size="2.5rem"
              color={COLORS.black90}
              aria-label="restart_icon"
            />
            <LegacyStyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('robot_controls:restart_label')}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
        <MenuItem
          key="deck-configuration"
          onClick={() => {
            history.push('/deck-configuration')
          }}
        >
          <Flex alignItems={ALIGN_CENTER}>
            <Icon name="deck-map" aria-label="deck-map_icon" size="2.5rem" />
            <LegacyStyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('deck_configuration')}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="light" onClick={toggleLights}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="light"
              size="2.5rem"
              color={COLORS.black90}
              aria-label="light_icon"
            />
            <LegacyStyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {i18n.format(
                t(lightsOn ? 'lights_off' : 'lights_on'),
                'capitalize'
              )}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
      </MenuList>
    </>
  )
}
