import * as React from 'react'
import { useHistory } from 'react-router-dom'

import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'

import {
  useGripperDisplayName,
  usePipetteModelSpecs,
} from '../../resources/instruments/hooks'
import { ChoosePipette } from '../PipetteWizardFlows/ChoosePipette'
import { FLOWS } from '../PipetteWizardFlows/constants'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import { LabeledMount } from './LabeledMount'

import type { InstrumentData } from '@opentrons/api-client'
import type { GripperModel, PipetteModel } from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'
import type { SelectablePipettes } from '../PipetteWizardFlows/types'
import type { GripperWizardFlows } from '../GripperWizardFlows'
import type { PipetteWizardFlows } from '../PipetteWizardFlows'

interface AttachedInstrumentMountItemProps {
  mount: Mount | 'extension'
  attachedInstrument: InstrumentData | null
  setWizardProps: (
    props:
      | React.ComponentProps<typeof GripperWizardFlows>
      | React.ComponentProps<typeof PipetteWizardFlows>
      | null
  ) => void
}

export function AttachedInstrumentMountItem(
  props: AttachedInstrumentMountItemProps
): JSX.Element {
  const history = useHistory()
  console.log(history)
  const { mount, attachedInstrument, setWizardProps } = props

  const [showChoosePipetteModal, setShowChoosePipetteModal] = React.useState(
    false
  )
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleClick: React.MouseEventHandler = () => {
    if (attachedInstrument == null && mount !== 'extension') {
      setShowChoosePipetteModal(true)
    } else if (attachedInstrument == null && mount === 'extension') {
      setWizardProps({
        flowType: GRIPPER_FLOW_TYPES.ATTACH,
        attachedGripper: attachedInstrument,
        onComplete: () => {
          history.push(
            attachedInstrument == null ? `/instruments` : `/instrument/${mount}`
          )
        },
        closeFlow: () => {
          setWizardProps(null)
        },
      })
    } else {
      history.push(`/instruments/${mount}`)
    }
  }

  const instrumentModel = attachedInstrument?.ok
    ? attachedInstrument.instrumentModel
    : null

  const pipetteDisplayName =
    usePipetteModelSpecs(instrumentModel as PipetteModel)?.displayName ?? null
  const gripperDisplayName = useGripperDisplayName(
    instrumentModel as GripperModel
  )

  const displayName =
    attachedInstrument?.ok && attachedInstrument?.mount === 'extension'
      ? gripperDisplayName
      : pipetteDisplayName

  return (
    <>
      <LabeledMount
        mount={mount}
        instrumentName={displayName}
        handleClick={handleClick}
      />
      {showChoosePipetteModal ? (
        <ChoosePipette
          proceed={() => {
            setWizardProps({
              mount: mount as Mount,
              flowType: FLOWS.ATTACH,
              selectedPipette,
              closeFlow: () => {
                setWizardProps(null)
                setSelectedPipette(SINGLE_MOUNT_PIPETTES)
                setShowChoosePipetteModal(false)
              },
              onComplete: () => {
                history.push(
                  attachedInstrument == null
                    ? `/instruments`
                    : `/instrument/${mount}`
                )
              },
            })
            setShowChoosePipetteModal(false)
          }}
          setSelectedPipette={setSelectedPipette}
          selectedPipette={selectedPipette}
          exit={() => {
            setShowChoosePipetteModal(false)
          }}
          mount={mount as Mount}
        />
      ) : null}
    </>
  )
}
