// top nav bar component
import * as React from 'react'
import { SubdomainNav, MainNav } from '../website-navigation'
import styles from './styles.module.css'

export { Breadcrumbs } from './Breadcrumbs'

export function Nav(): JSX.Element {
  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.subdomain_nav_wrapper}>
          <div className={styles.nav_container}>
            <SubdomainNav />
          </div>
        </div>
        <div className={styles.main_nav_wrapper}>
          <div className={styles.nav_container}>
            <MainNav />
          </div>
        </div>
      </nav>
    </>
  )
}
