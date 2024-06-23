// some colors are slightly adjusted for on-device display screen differences
// isTouchscreen hex values are dev concerns only - designs will reflect the standard hex values
import { isTouchscreen } from '../ui-style-constants/responsiveness'

/**
 * green
 */
export const green60 = '#03683E'
export const green50 = isTouchscreen ? '#1CA850' : '#04AA65'
export const green40 = isTouchscreen ? '#8EF3A8' : '#91E2C0'
export const green35 = isTouchscreen ? '#8AFBAB' : '#AFEDD3'
export const green30 = '#C4F6E0'
export const green20 = '#E8F7ED'

/**
 * red
 */
export const red60 = '#941313'
export const red55 = '#C71A1B'
export const red50 = '#DE1B1B'
export const red40 = '#F5B2B3'
export const red35 = '#F8C8C9'
export const red30 = '#FAD6D6'
export const red20 = '#FCE9E9'

/**
 * yellow
 */
export const yellow60 = '#825512'
export const yellow50 = '#F09D20'
export const yellow40 = '#FCD48B'
export const yellow35 = '#FFE1A4'
export const yellow30 = '#FFE9BE'
export const yellow20 = '#FDF3E2'

/**
 * purple
 */
export const purple60 = isTouchscreen ? '#612367' : '#562566'
export const purple55 = isTouchscreen ? '#822E89' : '#713187'
export const purple50 = isTouchscreen ? '#9E39A8' : '#893BA4'
export const purple40 = isTouchscreen ? '#E2A9EA' : '#CEA4DF'
export const purple35 = isTouchscreen ? '#ECC2F2' : '#DBBCE7'
export const purple30 = isTouchscreen ? '#F4DEF7' : '#E6D5EC'
export const purple20 = isTouchscreen ? '#FFF3FE' : '#F1E8F5'

/**
 * blue
 */
export const blue60 = '#004196'
export const blue55 = '#0056C8'
export const blue40 = '#A9CEFD'
export const blue35 = '#BFDCFD'
export const blue30 = '#D0E6FE'
export const blue20 = '#E1EFFF'
export const blue10 = '#F1F8FF'

/**
 * grey
 */
export const grey60 = '#4A4C4E'
export const grey55 = '#626467'
export const grey50 = '#737578'
export const grey40 = '#B7B8B9'
export const grey35 = '#CBCCCC'
export const grey30 = '#DEDEDE'
export const grey20 = '#E9E9E9'
export const grey10 = '#F3F3F3'

/**
 * core
 */
export const black90 = '#16212D'
export const black80 = '#24313F'
export const black70 = '#39495B'
export const white = '#FFFFFF'
export const blue50 = '#006CFA'

/**
 * flex
 */
export const flex55 = '#0297CC'
export const flex50 = '#00BDFF'

/**
 * extras
 */
export const transparent = 'transparent'
// opacity hex codes to append to 6-digit color hex codes
export const opacity20HexCode = '33' // 20% opacity
export const opacity40HexCode = '66' // 40% opacity
export const opacity60HexCode = '99' // 60% opacity
export const opacity90HexCode = 'E6' // 90% opacity
