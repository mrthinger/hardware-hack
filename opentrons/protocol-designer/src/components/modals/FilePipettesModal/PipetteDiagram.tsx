import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import cx from 'classnames'
import { FLEX_ROBOT_TYPE, getPipetteSpecsV2 } from '@opentrons/shared-data'
import { InstrumentDiagram } from '@opentrons/components'
import { getRobotType } from '../../../file-data/selectors'
import styles from './FilePipettesModal.module.css'
import type { PipetteName } from '@opentrons/shared-data'
import type { FormPipette } from '../../../step-forms/types'

interface Props {
  leftPipette?: FormPipette['pipetteName']
  rightPipette?: FormPipette['pipetteName']
}

export function PipetteDiagram(props: Props): JSX.Element {
  const { leftPipette, rightPipette } = props

  // TODO (ka 2020-4-16): This is temporaray until FF is removed.
  // Gross but neccessary for removing the wrapper div when FF is off.
  return (
    <div className={cx(styles.mount_diagram)}>
      <PipetteGroup leftPipette={leftPipette} rightPipette={rightPipette} />
    </div>
  )
}

function PipetteGroup(props: Props): JSX.Element {
  const { leftPipette, rightPipette } = props
  const robotType = useSelector(getRobotType)
  const leftSpecs = leftPipette && getPipetteSpecsV2(leftPipette as PipetteName)
  const has96Channel = leftPipette === 'p1000_96'
  const rightSpecs =
    rightPipette && getPipetteSpecsV2(rightPipette as PipetteName)
  return (
    <>
      {leftPipette && leftSpecs ? (
        <InstrumentDiagram
          pipetteSpecs={leftSpecs}
          className={styles.left_pipette}
          mount="left"
          imageStyle={
            robotType === FLEX_ROBOT_TYPE
              ? css`
                  margin-right: 1rem;
                `
              : undefined
          }
        />
      ) : (
        <div
          className={styles.left_pipette}
          style={{
            marginLeft: robotType === FLEX_ROBOT_TYPE ? '7rem' : '0rem',
          }}
        />
      )}
      {rightPipette && rightSpecs && !has96Channel ? (
        <InstrumentDiagram
          pipetteSpecs={rightSpecs}
          className={styles.right_pipette}
          mount="right"
          imageStyle={
            robotType === FLEX_ROBOT_TYPE
              ? css`
                  right: -5rem;
                  position: absolute;
                `
              : undefined
          }
        />
      ) : (
        <div className={styles.right_pipette} />
      )}
    </>
  )
}
