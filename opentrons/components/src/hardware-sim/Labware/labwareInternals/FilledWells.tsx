import * as React from 'react'
import map from 'lodash/map'
import { COLORS } from '../../../helix-design-system'
import { Well } from './Well'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { CSSProperties } from 'styled-components'

export interface FilledWellsProps {
  definition: LabwareDefinition2
  fillByWell: Record<string, CSSProperties['fill']>
}

function FilledWellsComponent(props: FilledWellsProps): JSX.Element {
  const { definition, fillByWell } = props
  return (
    <>
      {map<Record<string, CSSProperties['fill']>, React.ReactNode>(
        fillByWell,
        (color: CSSProperties['fill'], wellName: string): JSX.Element => {
          return (
            <Well
              key={wellName}
              wellName={wellName}
              well={definition.wells[wellName]}
              fill={color}
              stroke={COLORS.black90}
              strokeWidth="0.6"
            />
          )
        }
      )}
    </>
  )
}

export const FilledWells: React.MemoExoticComponent<
  typeof FilledWellsComponent
> = React.memo(FilledWellsComponent)
