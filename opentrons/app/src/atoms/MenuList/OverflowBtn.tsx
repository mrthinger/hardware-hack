import * as React from 'react'
import { css } from 'styled-components'
import { Btn, BORDERS, COLORS, SPACING } from '@opentrons/components'

export const OverflowBtn: (
  props: React.ComponentProps<typeof Btn>,
  ref: React.ForwardedRef<HTMLInputElement>
) => React.ReactNode = React.forwardRef(
  (
    props: React.ComponentProps<typeof Btn>,
    ref: React.ForwardedRef<HTMLInputElement>
  ): JSX.Element => {
    return (
      <Btn
        css={css`
          border-radius: ${BORDERS.borderRadius4};
          max-height: ${SPACING.spacing32};

          &:hover {
            background-color: ${COLORS.grey30};
          }
          &:hover circle {
            fill: ${COLORS.grey55};
          }

          &:active,
          &:focus {
            background-color: ${COLORS.grey35};
          }

          &:active circle,
          &:focus circle {
            fill: ${COLORS.grey60};
          }

          &:focus-visible {
            box-shadow: ${`0 0 0 3px ${COLORS.yellow50}`};
            background-color: ${'transparent'};
          }

          &:focus-visible circle {
            fill: ${COLORS.grey60};
          }

          &:disabled circle {
            fill: ${COLORS.grey40};
          }
          &:disabled {
            background-color: transparent;
          }
        `}
        {...props}
        ref={ref}
      >
        <svg
          width="19"
          height="31"
          viewBox="0 0 19 31"
          fill={COLORS.grey50}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9.5" cy="9.5" r="1.5" />
          <circle cx="9.5" cy="15.5" r="1.5" />
          <circle cx="9.5" cy="21.5" r="1.5" />
        </svg>
      </Btn>
    )
  }
)
