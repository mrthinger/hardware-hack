import * as React from 'react'
import { createPortal } from 'react-dom'
import { Popper, Reference, Manager } from 'react-popper'
import cx from 'classnames'
import { getTopPortalEl } from '../portals/TopPortal'
import { PillTooltipContents } from '../steplist/SubstepRow'
import styles from './labware.module.css'
import type { LocationLiquidState } from '@opentrons/step-generation'
import type { WellIngredientNames } from '../../steplist/types'

const DEFAULT_TOOLTIP_OFFSET = 22
const WELL_BORDER_WIDTH = 4

interface WellTooltipParams {
  makeHandleMouseEnterWell: (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: React.MouseEvent<any>) => void
  handleMouseLeaveWell: (val: unknown) => void
  tooltipWellName?: string | null
}

interface WellTooltipProps {
  children: (wellTooltipParams: WellTooltipParams) => React.ReactNode
  ingredNames: WellIngredientNames
}

interface State {
  tooltipX?: number | null
  tooltipY?: number | null
  tooltipWellName?: string | null
  tooltipWellIngreds?: LocationLiquidState | null
  tooltipOffset?: number | null
}
const initialTooltipState: State = {
  tooltipX: null,
  tooltipY: null,
  tooltipWellName: null,
  tooltipWellIngreds: null,
  tooltipOffset: DEFAULT_TOOLTIP_OFFSET,
}

export const WellTooltip = (props: WellTooltipProps): JSX.Element => {
  const { children, ingredNames } = props
  const [tooltipState, setTooltipState] = React.useState<State>(
    initialTooltipState
  )

  const makeHandleMouseEnterWell: (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: React.MouseEvent) => void = (wellName, wellIngreds) => e => {
    const { target } = e
    if (target instanceof Element) {
      const wellBoundingRect = target.getBoundingClientRect()
      const { left, top, height, width } = wellBoundingRect
      if (Object.keys(wellIngreds).length > 0 && left && top) {
        setTooltipState({
          tooltipX: left + width / 2,
          tooltipY: top + height / 2,
          tooltipWellName: wellName,
          tooltipWellIngreds: wellIngreds,
          tooltipOffset: height / 2,
        })
      }
    }
  }

  const handleMouseLeaveWell = (): void => {
    setTooltipState(initialTooltipState)
  }

  const {
    tooltipX,
    tooltipY,
    tooltipOffset,
    tooltipWellIngreds,
    tooltipWellName,
  } = tooltipState

  return (
    <>
      <Manager>
        <Reference>
          {({ ref }) =>
            createPortal(
              <div
                ref={ref}
                className={styles.virtual_reference}
                // @ts-expect-error(sa, 2021-6-21): can't use null as top and left, default to undefined
                style={{ top: tooltipY, left: tooltipX }}
              />,
              getTopPortalEl()
            )
          }
        </Reference>
        {children({
          makeHandleMouseEnterWell: makeHandleMouseEnterWell,
          handleMouseLeaveWell: handleMouseLeaveWell,
          tooltipWellName: tooltipWellName,
        })}
        {tooltipWellName && (
          <Popper
            modifiers={{
              offset: {
                // @ts-expect-error(sa, 2021-6-21): tooltipOffset might be null or undefined
                offset: `0, ${tooltipOffset + WELL_BORDER_WIDTH * 2}`,
              },
            }}
          >
            {({ ref, style, placement, arrowProps }) => {
              return createPortal(
                <div
                  style={style}
                  ref={ref}
                  data-placement={placement}
                  className={styles.tooltip_box}
                >
                  <PillTooltipContents
                    well={tooltipWellName || ''}
                    ingredNames={ingredNames}
                    ingreds={tooltipWellIngreds || {}}
                  />
                  <div
                    className={cx(styles.arrow, styles[placement])}
                    ref={arrowProps.ref}
                    style={arrowProps.style}
                  />
                </div>,
                getTopPortalEl()
              )
            }}
          </Popper>
        )}
      </Manager>
    </>
  )
}
