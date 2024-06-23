import { rootSelector as navigationRootSelector } from './reducers'
import type { BaseState, Selector } from '../types'
import type { Page } from './types'
export const getNewProtocolModal: Selector<boolean> = (state: BaseState) =>
  navigationRootSelector(state).newProtocolModal
export const getCurrentPage: Selector<Page> = (state: BaseState) => {
  const page = navigationRootSelector(state).page
  return page
}
