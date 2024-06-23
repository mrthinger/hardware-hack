import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'
import { when } from 'vitest-when'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { IncompatibleModuleDesktopModalBody } from '../IncompatibleModuleDesktopModalBody'
import { useIsFlex } from '../../Devices/hooks'
import * as Fixtures from '../__fixtures__'

vi.mock('../../Devices/hooks')

const getRenderer = (isFlex: boolean) => {
  when(useIsFlex).calledWith('otie').thenReturn(isFlex)
  return (
    props: React.ComponentProps<typeof IncompatibleModuleDesktopModalBody>
  ) => {
    return renderWithProviders(
      <IncompatibleModuleDesktopModalBody {...props} />,
      {
        i18nInstance: i18n,
      }
    )[0]
  }
}

describe('IncompatibleModuleDesktopModalBody', () => {
  let props: React.ComponentProps<typeof IncompatibleModuleDesktopModalBody>
  beforeEach(() => {
    props = {
      modules: [],
      robotName: 'otie',
    }
  })

  it('should render i18nd footer text', () => {
    props = { ...props, modules: Fixtures.oneIncompatibleModule as any }
    getRenderer(true)(props)
    screen.getByText(
      'You must remove incompatible modules before using this robot.'
    )
    screen.getByText('otie needs your assistance')
  })
  ;['Flex', 'OT-2'].forEach(robotKind =>
    it(`should render a module card that says ${robotKind}`, () => {
      props = { ...props, modules: Fixtures.oneIncompatibleModule as any }
      getRenderer(robotKind === 'Flex')(props)
      screen.getByText(
        `Thermocycler Module GEN1 is not compatible with the ${robotKind}`
      )
    })
  )
})
