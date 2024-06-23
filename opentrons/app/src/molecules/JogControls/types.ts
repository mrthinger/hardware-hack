import type {
  HORIZONTAL_PLANE,
  VERTICAL_PLANE,
  NULL_STEP_SIZE_MM,
  SMALL_STEP_SIZE_MM,
  MEDIUM_STEP_SIZE_MM,
  LARGE_STEP_SIZE_MM,
} from './constants'

export type Axis = 'x' | 'y' | 'z'
export type Sign = -1 | 1
export type StepSize =
  | typeof NULL_STEP_SIZE_MM
  | typeof SMALL_STEP_SIZE_MM
  | typeof MEDIUM_STEP_SIZE_MM
  | typeof LARGE_STEP_SIZE_MM

// TODO: bc(2020-12-14) instead of three params, prefer single vector
// param e.g. [0,0,-0.1]. All Instance of JogVector currently translate to vector
// except Labware Calibration. Once Labware Calibration is updated, update this
// type and remove it's constituent types (Axis, Sign, StepSize)
export type Jog = (
  axis: Axis,
  direction: Sign,
  step: StepSize,
  onSuccess?: (...args: any[]) => void
) => unknown

export type Plane = typeof HORIZONTAL_PLANE | typeof VERTICAL_PLANE
export type Bearing = 'left' | 'right' | 'forward' | 'back' | 'up' | 'down'
