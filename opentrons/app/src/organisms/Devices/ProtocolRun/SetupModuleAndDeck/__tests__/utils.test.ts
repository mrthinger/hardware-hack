import { describe, it, expect } from 'vitest'
import { getFixtureImage, getModuleImage } from '../utils'

describe('getModuleImage', () => {
  it('should render the magnetic module image when the model is a magnetic module gen 1', () => {
    const result = getModuleImage('magneticModuleV1')
    expect(result).toEqual(
      '/app/src/assets/images/magnetic_module_gen_2_transparent.png'
    )
  })

  it('should render the magnetic module image when the model is a magnetic module gen 2', () => {
    const result = getModuleImage('magneticModuleV2')
    expect(result).toEqual(
      '/app/src/assets/images/magnetic_module_gen_2_transparent.png'
    )
  })

  it('should render the temperature module image when the model is a temperature module gen 1', () => {
    const result = getModuleImage('temperatureModuleV1')
    expect(result).toEqual(
      '/app/src/assets/images/temp_deck_gen_2_transparent.png'
    )
  })

  it('should render the temperature module image when the model is a temperature module gen 2', () => {
    const result = getModuleImage('temperatureModuleV2')
    expect(result).toEqual(
      '/app/src/assets/images/temp_deck_gen_2_transparent.png'
    )
  })

  it('should render the heater-shaker module image when the model is a heater-shaker module gen 1', () => {
    const result = getModuleImage('heaterShakerModuleV1')
    expect(result).toEqual(
      '/app/src/assets/images/heater_shaker_module_transparent.png'
    )
  })

  it('should render the thermocycler module image when the model is a thermocycler module gen 1', () => {
    const result = getModuleImage('thermocyclerModuleV1')
    expect(result).toEqual('/app/src/assets/images/thermocycler_closed.png')
  })

  it('should render the thermocycler module image when the model is a thermocycler module gen 2', () => {
    const result = getModuleImage('thermocyclerModuleV2')
    expect(result).toEqual(
      '/app/src/assets/images/thermocycler_gen_2_closed.png'
    )
  })

  it('should render the magnetic block v1 image when the module is magneticBlockV1', () => {
    const result = getModuleImage('magneticBlockV1')
    expect(result).toEqual('/app/src/assets/images/magnetic_block_gen_1.png')
  })
})

describe('getFixtureImage', () => {
  it('should render the staging area image', () => {
    const result = getFixtureImage('stagingAreaRightSlot')
    expect(result).toEqual('/app/src/assets/images/staging_area_slot.png')
  })
  it('should render the waste chute image', () => {
    const result = getFixtureImage('wasteChuteRightAdapterNoCover')
    expect(result).toEqual('/app/src/assets/images/waste_chute.png')
  })
  it('should render the waste chute staging area image', () => {
    const result = getFixtureImage(
      'stagingAreaSlotWithWasteChuteRightAdapterCovered'
    )
    expect(result).toEqual(
      '/app/src/assets/images/waste_chute_with_staging_area.png'
    )
  })
  it('should render the trash bin image', () => {
    const result = getFixtureImage('trashBinAdapter')
    expect(result).toEqual('/app/src/assets/images/flex_trash_bin.png')
  })
})
