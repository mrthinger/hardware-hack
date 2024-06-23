import * as React from 'react'
import cx from 'classnames'
import styles from './styles.module.css'

import type { Link } from './types'

interface Props extends Link {
  className?: string
}

export function NavLink(props: Props): JSX.Element {
  const {
    gtm: { category, label, action },
  } = props
  return (
    <div className={cx(styles.link_group, props.className)}>
      <a
        href={props.url}
        className={cx(styles.link_title, { [styles.link_cta]: props.cta })}
        target="_blank"
        rel="noopener noreferrer"
        data-gtm-category={category}
        data-gtm-label={label}
        data-gtm-action={action}
      >
        {props.name}
      </a>
      {props.description && (
        <div className={styles.link_description}>{props.description}</div>
      )}
    </div>
  )
}

export function NavButton(props: Link): JSX.Element {
  return (
    <a
      href={props.url}
      className={styles.link_button}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.name} ›
    </a>
  )
}
