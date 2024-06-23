import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  useOnClickOutside,
} from '@opentrons/components'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import { formatLastCalibrated } from './CalibrationDetails/utils'
import { useIsEstopNotDisengaged } from '../../resources/devices/hooks/useIsEstopNotDisengaged'

import type { GripperData } from '@opentrons/api-client'

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding: ${SPACING.spacing8};
`
const StyledTableRow = styled.tr`
  padding: ${SPACING.spacing8};
  border-bottom: ${BORDERS.lineBorder};
`
const StyledTableCell = styled.td`
  padding: ${SPACING.spacing8};
  text-overflow: wrap;
`

const BODY_STYLE = css`
  box-shadow: 0 0 0 1px ${COLORS.grey30};
  border-radius: 3px;
`

interface RobotSettingsGripperCalibrationProps {
  gripper: GripperData | null
  robotName: string
}

export function RobotSettingsGripperCalibration(
  props: RobotSettingsGripperCalibrationProps
): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { gripper, robotName } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const calsOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const [showWizardFlow, setShowWizardFlow] = React.useState<boolean>(false)
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  const gripperCalibrationLastModified =
    gripper?.data.calibratedOffset?.last_modified

  const handleCalibrate = (): void => {
    setShowOverflowMenu(false)
    setShowWizardFlow(true)
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingY={SPACING.spacing24}
      gridGap={SPACING.spacing8}
    >
      <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('gripper_calibration_title')}
      </LegacyStyledText>
      <LegacyStyledText as="p">
        {t('gripper_calibration_description')}
      </LegacyStyledText>
      {gripper == null ? (
        <LegacyStyledText as="label" marginTop={SPACING.spacing8}>
          {t('no_gripper_attached')}
        </LegacyStyledText>
      ) : (
        <StyledTable>
          <thead>
            <tr>
              <StyledTableHeader>{t('gripper_serial')}</StyledTableHeader>
              <StyledTableHeader>
                {t('last_calibrated_label')}
              </StyledTableHeader>
            </tr>
          </thead>
          <tbody css={BODY_STYLE}>
            <StyledTableRow>
              <StyledTableCell>
                <LegacyStyledText as="p">
                  {gripper.serialNumber}
                </LegacyStyledText>
              </StyledTableCell>
              <StyledTableCell>
                <Flex alignItems={ALIGN_CENTER}>
                  {gripperCalibrationLastModified != null ? (
                    <LegacyStyledText as="p">
                      {formatLastCalibrated(gripperCalibrationLastModified)}
                    </LegacyStyledText>
                  ) : (
                    <LegacyStyledText as="p">
                      {t('not_calibrated_short')}
                    </LegacyStyledText>
                  )}
                </Flex>
              </StyledTableCell>
              <StyledTableCell>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  position={POSITION_RELATIVE}
                >
                  <OverflowBtn
                    alignSelf={ALIGN_FLEX_END}
                    aria-label="CalibrationOverflowMenu_button_gripperCalibration"
                    onClick={handleOverflowClick}
                    disabled={isEstopNotDisengaged}
                  />
                  {showWizardFlow ? (
                    <GripperWizardFlows
                      flowType={'RECALIBRATE'}
                      attachedGripper={gripper}
                      closeFlow={() => {
                        setShowWizardFlow(false)
                      }}
                    />
                  ) : null}
                  {showOverflowMenu ? (
                    <Flex
                      ref={calsOverflowWrapperRef}
                      whiteSpace="nowrap"
                      zIndex={10}
                      borderRadius="4px 4px 0px 0px"
                      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
                      position={POSITION_ABSOLUTE}
                      backgroundColor={COLORS.white}
                      top="2.3rem"
                      right={0}
                      flexDirection={DIRECTION_COLUMN}
                    >
                      <MenuItem onClick={handleCalibrate}>
                        {t(
                          gripperCalibrationLastModified == null
                            ? 'calibrate_gripper'
                            : 'recalibrate_gripper'
                        )}
                      </MenuItem>
                    </Flex>
                  ) : null}
                  {menuOverlay}
                </Flex>
              </StyledTableCell>
            </StyledTableRow>
          </tbody>
        </StyledTable>
      )}
    </Flex>
  )
}
