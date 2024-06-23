import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  BUTTON_TYPE_SUBMIT,
  OutlineButton,
  ModalShell,
  Flex,
  SPACING,
  DIRECTION_ROW,
  Box,
  Text,
  ALIGN_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_END,
  DeckConfigurator,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import {
  SINGLE_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_CUTOUTS,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
} from '@opentrons/shared-data'
import { createModule, deleteModule } from '../../../step-forms/actions'
import { getLabwareOnSlot, getSlotIsEmpty } from '../../../step-forms'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import { PDAlert } from '../../alerts/PDAlert'
import type {
  DeckConfiguration,
  CutoutId,
  ModuleType,
} from '@opentrons/shared-data'
import type { Control, ControllerRenderProps } from 'react-hook-form'
import type { ModuleOnDeck } from '../../../step-forms'

export interface EditMultipleModulesModalValues {
  selectedAddressableAreas: string[]
}

interface EditMultipleModulesModalComponentProps
  extends EditMultipleModulesModalProps {
  control: Control<EditMultipleModulesModalValues, 'selectedAddressableAreas'>
  moduleLocations: string[] | null
}

const EditMultipleModulesModalComponent = (
  props: EditMultipleModulesModalComponentProps
): JSX.Element => {
  const { t } = useTranslation(['button', 'alert'])
  const {
    onCloseClick,
    allModulesOnDeck,
    control,
    moduleLocations,
    moduleType,
  } = props
  const initialDeckSetup = useSelector(getInitialDeckSetup)

  const selectedSlots = useWatch({
    control,
    name: 'selectedAddressableAreas',
    defaultValue: moduleLocations ?? [],
  })
  const occupiedCutoutIds = selectedSlots
    .map(slot => {
      const hasModSlot =
        allModulesOnDeck.find(
          module =>
            module.type === moduleType && slot === `cutout${module.slot}`
        ) != null
      const labwareOnSlot = getLabwareOnSlot(initialDeckSetup, slot)
      const isLabwareCompatible =
        (labwareOnSlot &&
          getLabwareIsCompatible(labwareOnSlot.def, moduleType)) ??
        true
      const isEmpty =
        (getSlotIsEmpty(initialDeckSetup, slot, true) || hasModSlot) &&
        isLabwareCompatible

      return { slot, isEmpty }
    })
    .filter(slot => !slot.isEmpty)
  const hasConflictedSlot = occupiedCutoutIds.length > 0
  const mappedModules: DeckConfiguration =
    moduleLocations != null
      ? moduleLocations.flatMap(location => {
          return [
            {
              cutoutId: location as CutoutId,
              cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
            },
          ]
        })
      : []
  const STANDARD_EMPTY_SLOTS: DeckConfiguration = TEMPERATURE_MODULE_CUTOUTS.map(
    cutoutId => ({
      cutoutId,
      cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
    })
  )

  STANDARD_EMPTY_SLOTS.forEach(emptySlot => {
    if (
      !mappedModules.some(({ cutoutId }) => cutoutId === emptySlot.cutoutId)
    ) {
      mappedModules.push(emptySlot)
    }
  })

  const selectableSlots =
    mappedModules.length > 0 ? mappedModules : STANDARD_EMPTY_SLOTS
  const [updatedSlots, setUpdatedSlots] = React.useState<DeckConfiguration>(
    selectableSlots
  )
  const handleClickAdd = (
    cutoutId: string,
    field: ControllerRenderProps<
      EditMultipleModulesModalValues,
      'selectedAddressableAreas'
    >
  ): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return {
          ...slot,
          cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
        }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)
    const updatedSelectedSlots = [...selectedSlots, cutoutId]
    field.onChange(updatedSelectedSlots)
  }

  const handleClickRemove = (
    cutoutId: string,
    field: ControllerRenderProps<
      EditMultipleModulesModalValues,
      'selectedAddressableAreas'
    >
  ): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return { ...slot, cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)

    field.onChange(selectedSlots.filter(item => item !== cutoutId))
  }
  const occupiedSlots = occupiedCutoutIds.map(
    occupiedCutout => occupiedCutout.slot.split('cutout')[1]
  )
  const alertDescription = t(
    `alert:module_placement.SLOTS_OCCUPIED.${
      occupiedSlots.length === 1 ? 'single' : 'multi'
    }`,
    {
      slotName: occupiedSlots,
    }
  )

  return (
    <>
      <Flex height="23rem" flexDirection={DIRECTION_COLUMN}>
        <Flex
          justifyContent={JUSTIFY_END}
          alignItems={ALIGN_CENTER}
          height="1.5rem"
          paddingX={SPACING.spacing32}
        >
          <Box>
            {hasConflictedSlot ? (
              <PDAlert
                alertType="warning"
                title={t('alert:module_placement.SLOT_OCCUPIED.title')}
                description={alertDescription}
              />
            ) : null}
          </Box>
        </Flex>
        <Controller
          name="selectedAddressableAreas"
          control={control}
          defaultValue={moduleLocations ?? []}
          render={({ field }) => (
            <DeckConfigurator
              deckConfig={updatedSlots}
              handleClickAdd={cutoutId => {
                handleClickAdd(cutoutId, field)
              }}
              handleClickRemove={cutoutId => {
                handleClickRemove(cutoutId, field)
              }}
              showExpansion={false}
            />
          )}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
        paddingRight={SPACING.spacing32}
        paddingBottom={SPACING.spacing32}
        gridGap={SPACING.spacing8}
      >
        <OutlineButton onClick={onCloseClick}>{t('cancel')}</OutlineButton>
        <OutlineButton type={BUTTON_TYPE_SUBMIT} disabled={hasConflictedSlot}>
          {t('save')}
        </OutlineButton>
      </Flex>
    </>
  )
}

export interface EditMultipleModulesModalProps {
  onCloseClick: () => void
  allModulesOnDeck: ModuleOnDeck[]
  moduleType: ModuleType
}
export function EditMultipleModulesModal(
  props: EditMultipleModulesModalProps
): JSX.Element {
  const { onCloseClick, allModulesOnDeck, moduleType } = props
  const { t } = useTranslation('modules')
  const dispatch = useDispatch()
  const { control, handleSubmit } = useForm<EditMultipleModulesModalValues>()
  const moduleLocations = Object.values(allModulesOnDeck)
    .filter(module => module.type === moduleType)
    .map(temp => `cutout${temp.slot}`)

  const onSaveClick = (data: EditMultipleModulesModalValues): void => {
    onCloseClick()

    data.selectedAddressableAreas.forEach(aa => {
      const moduleInSlot = Object.values(allModulesOnDeck).find(module =>
        aa.includes(module.slot)
      )
      if (!moduleInSlot) {
        dispatch(
          createModule({
            slot: aa.split('cutout')[1],
            type: TEMPERATURE_MODULE_TYPE,
            model: TEMPERATURE_MODULE_V2,
          })
        )
      }
    })
    Object.values(allModulesOnDeck).forEach(module => {
      const moduleCutout = `cutout${module.slot}`
      if (!data.selectedAddressableAreas.includes(moduleCutout)) {
        dispatch(deleteModule(module.id))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSaveClick)}>
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">
            {t('module_display_names.multipleTemperatureModuleTypes')}
          </Text>
        </Box>
        <EditMultipleModulesModalComponent
          onCloseClick={onCloseClick}
          allModulesOnDeck={allModulesOnDeck}
          control={control}
          moduleLocations={moduleLocations}
          moduleType={moduleType}
        />
      </ModalShell>
    </form>
  )
}
