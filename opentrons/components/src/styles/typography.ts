import { css } from 'styled-components'

import { C_DARK_GRAY, C_WHITE } from './colors'

import type { FlattenSimpleInterpolation } from 'styled-components'

// font size values
export const FONT_SIZE_HUGE = '3rem'
export const FONT_SIZE_BIG = '1.5rem'
export const FONT_SIZE_HEADER = '1.125rem'
export const FONT_SIZE_DEFAULT = '1rem'
export const FONT_SIZE_BODY_2 = '0.875rem'
export const FONT_SIZE_BODY_1 = '0.75rem'
export const FONT_SIZE_CAPTION = '0.625rem'
export const FONT_SIZE_TINY = '0.325rem'
export const FONT_SIZE_MICRO = '0.2rem'
export const FONT_SIZE_INHERIT = 'inherit'

// line height values
export const LINE_HEIGHT_SOLID = 1
export const LINE_HEIGHT_TITLE = 1.25
export const LINE_HEIGHT_COPY = 1.5

// font weight values
export const FONT_WEIGHT_LIGHT = 300
export const FONT_WEIGHT_REGULAR = 400
export const FONT_WEIGHT_SEMIBOLD = 600
export const FONT_WEIGHT_BOLD = 800

// font style values
export const FONT_STYLE_NORMAL = 'normal'
export const FONT_STYLE_ITALIC = 'italic'

// text align
export const TEXT_ALIGN_LEFT = 'left'
export const TEXT_ALIGN_CENTER = 'center'
export const TEXT_ALIGN_RIGHT = 'right'
export const TEXT_ALIGN_JUSTIFY = 'justify'

// text transform
export const TEXT_TRANSFORM_NONE = 'none'
export const TEXT_TRANSFORM_CAPITALIZE = 'capitalize'
export const TEXT_TRANSFORM_UPPERCASE = 'uppercase'
export const TEXT_TRANSFORM_LOWERCASE = 'lowercase'

// text decoration
export const TEXT_DECORATION_UNDERLINE = 'underline'

// font property sets
export const FONT_HEADER_DARK: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_HEADER};
  font-weight: ${FONT_WEIGHT_SEMIBOLD};
  color: ${C_DARK_GRAY};
`

export const FONT_HEADER_THIN: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_HEADER};
  font-weight: ${FONT_WEIGHT_REGULAR};
  color: ${C_DARK_GRAY};
`

export const FONT_BODY_1_DARK: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_BODY_1};
  font-weight: ${FONT_WEIGHT_REGULAR};
  color: ${C_DARK_GRAY};
`

export const FONT_BODY_1_LIGHT: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_BODY_1};
  font-weight: ${FONT_WEIGHT_REGULAR};
  color: ${C_WHITE};
`

export const FONT_BODY_2_DARK: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_BODY_2};
  font-weight: ${FONT_WEIGHT_REGULAR};
  color: ${C_DARK_GRAY};
`

export const FONT_BODY_1_DARK_SEMIBOLD: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_BODY_1};
  font-weight: ${FONT_WEIGHT_SEMIBOLD};
  color: ${C_DARK_GRAY};
`

export const FONT_HUGE_DARK_SEMIBOLD: FlattenSimpleInterpolation = css`
  font-size: ${FONT_SIZE_HUGE};
  font-weight: ${FONT_WEIGHT_SEMIBOLD};
  color: ${C_DARK_GRAY};
`
