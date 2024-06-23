import * as React from 'react'
import { Flex } from '../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../styles'
import singleSrc from './single_channel_GEN1_800px.png'
import multiSrc from './multi-channel_GEN1_800px.png'
import singleGEN2Src from './single-channel_GEN2_800px.png'
import multiGEN2Src from './multi-channel_GEN2_800px.png'
import singleFlexSrc from './single-channel-flex.png'
import eightChannelFlexSrc from './eight-channel-flex.png'
import ninetySixSrc from './ninety-six-channel-gen1.png'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { Mount } from '../robot-types'
import type { StyleProps } from '..'

export interface InstrumentDiagramProps extends StyleProps {
  mount: Mount
  pipetteSpecs?: Pick<PipetteV2Specs, 'displayCategory' | 'channels'> | null
  className?: string
  imageStyle?: FlattenSimpleInterpolation
}

export function InstrumentDiagram(props: InstrumentDiagramProps): JSX.Element {
  const { mount, pipetteSpecs, className, imageStyle, ...styleProps } = props
  const { displayCategory, channels } = pipetteSpecs || {}

  let imgSrc
  switch (displayCategory) {
    case 'FLEX': {
      imgSrc = channels === 1 ? singleFlexSrc : eightChannelFlexSrc
      break
    }
    case 'GEN2': {
      imgSrc = channels === 1 ? singleGEN2Src : multiGEN2Src
      break
    }
    case 'GEN1':
    default: {
      imgSrc = channels === 1 ? singleSrc : multiSrc
    }
  }
  return (
    <Flex
      className={className}
      transform={mount === 'right' ? 'scaleX(-1)' : ''}
      filter={mount === 'right' ? 'FlipH' : ''}
      {...styleProps}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <img
        src={channels === 96 ? ninetySixSrc : imgSrc}
        css={imageStyle}
        height="100%"
      />
    </Flex>
  )
}
