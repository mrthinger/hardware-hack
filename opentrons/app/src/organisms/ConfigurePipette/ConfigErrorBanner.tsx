import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import styles from './styles.module.css'

interface Props {
  message?: string | null
}

const TITLE = 'Error updating pipette settings'

export function ConfigErrorBanner(props: Props): JSX.Element | null {
  const { message } = props
  const [dismissed, setDismissed] = React.useState(false)
  if (message == null || dismissed) return null

  return (
    <AlertItem
      type="warning"
      onCloseClick={() => {
        setDismissed(true)
      }}
      title={TITLE}
    >
      <p className={styles.config_submit_error}>
        Some of the pipette config settings submitted were not valid.
      </p>
      <p className={styles.config_submit_error}>
        <strong>ERROR: {message}</strong>
      </p>
      <p className={styles.config_submit_error}>Please contact support.</p>
    </AlertItem>
  )
}
