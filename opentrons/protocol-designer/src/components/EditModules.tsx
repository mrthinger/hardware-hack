import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  FLEX_ROBOT_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
} from '../step-forms'
import { moveDeckItem } from '../labware-ingred/actions/actions'
import { getRobotType } from '../file-data/selectors'
import { EditMultipleModulesModal } from './modals/EditModulesModal/EditMultipleModulesModal'
import { useBlockingHint } from './Hints/useBlockingHint'
import { MagneticModuleWarningModalContent } from './modals/EditModulesModal/MagneticModuleWarningModalContent'
import { EditModulesModal } from './modals/EditModulesModal'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

export interface EditModulesProps {
  moduleToEdit: {
    moduleId?: string | null
    moduleType: ModuleType
  }
  onCloseClick: () => void
}

export interface ModelModuleInfo {
  model: ModuleModel
  slot: string
}

export const EditModules = (props: EditModulesProps): JSX.Element => {
  const { onCloseClick, moduleToEdit } = props
  const { moduleId, moduleType } = moduleToEdit
  const _initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const robotType = useSelector(getRobotType)
  const showMultipleModuleModal =
    robotType === FLEX_ROBOT_TYPE && moduleType === TEMPERATURE_MODULE_TYPE

  const moduleOnDeck = moduleId ? _initialDeckSetup.modules[moduleId] : null
  const [
    changeModuleWarningInfo,
    displayModuleWarning,
  ] = React.useState<null | ModelModuleInfo>(null)
  const dispatch = useDispatch()

  const editModuleModel = (selectedModel: ModuleModel): void => {
    if (moduleOnDeck?.id != null) {
      dispatch(
        stepFormActions.editModule({
          id: moduleOnDeck.id,
          model: selectedModel,
        })
      )
    } else {
      console.error(
        `cannot edit module model without module id. This shouldn't be able to happen`
      )
    }
  }
  const editModuleSlot = (selectedSlot: string): void => {
    if (selectedSlot && moduleOnDeck && moduleOnDeck.slot !== selectedSlot) {
      dispatch(moveDeckItem(moduleOnDeck.slot, selectedSlot))
    }
  }

  const changeModuleWarning = useBlockingHint({
    hintKey: 'change_magnet_module_model',
    handleCancel: () => {
      displayModuleWarning(null)
    },
    handleContinue: () => {
      if (changeModuleWarningInfo) {
        editModuleModel(changeModuleWarningInfo.model)
        editModuleSlot(changeModuleWarningInfo.slot)
      } else {
        console.error('no module info set, could not edit module')
      }
      displayModuleWarning(null)
      onCloseClick()
    },
    content: <MagneticModuleWarningModalContent />,
    enabled: changeModuleWarningInfo !== null,
  })

  let modal = (
    <EditModulesModal
      moduleType={moduleType}
      moduleOnDeck={moduleOnDeck}
      onCloseClick={onCloseClick}
      editModuleSlot={editModuleSlot}
      editModuleModel={editModuleModel}
      displayModuleWarning={displayModuleWarning}
    />
  )
  if (showMultipleModuleModal) {
    modal = (
      <EditMultipleModulesModal
        onCloseClick={onCloseClick}
        allModulesOnDeck={Object.values(_initialDeckSetup.modules)}
        moduleType={moduleType}
      />
    )
  }
  return changeModuleWarning ?? modal
}
