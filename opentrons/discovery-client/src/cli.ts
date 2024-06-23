import Yargs from 'yargs'
import noop from 'lodash/noop'
import { createDiscoveryClient, DEFAULT_PORT } from '.'

import type { MiddlewareFunction } from 'yargs'

import type {
  DiscoveryClient,
  DiscoveryClientRobot,
  DiscoveryClientRobotAddress,
  LogLevel,
  Logger,
} from './types'

const LOG_LVLS: LogLevel[] = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
]

interface Argv {
  pollInterval: number
  nameFilter: string[]
  ipFilter: string[]
  candidates: string[]
  logLevel: LogLevel | string
}

interface FindArgv extends Argv {
  name?: string
  timeout: number
}

const createLogger = (argv: Argv): Logger => {
  const level = (LOG_LVLS as string[]).indexOf(argv.logLevel)

  return {
    error: level >= 0 ? console.error : noop,
    warn: level >= 1 ? console.warn : noop,
    info: level >= 2 ? console.info : noop,
    http: level >= 3 ? console.debug : noop,
    verbose: level >= 4 ? console.debug : noop,
    debug: level >= 5 ? console.debug : noop,
    silly: level >= 6 ? console.debug : noop,
  }
}

const debugLogArgvMiddleware: MiddlewareFunction<Argv> = (argv): void => {
  const log = createLogger(argv)
  log.debug(`Calling ${argv.$0} with argv:`, argv)

  // @ts-expect-error(mc, 2021-02-16): this return is probably unnecessary, remove
  return argv
}

const passesFilters = (argv: Argv) => (robot: DiscoveryClientRobot) => {
  const { nameFilter, ipFilter } = argv

  // check name filter
  const passName =
    nameFilter.length === 0 ||
    nameFilter.some(nameMatch => robot.name.includes(nameMatch))

  const passIp =
    ipFilter.length === 0 ||
    ipFilter.some(ipMatch =>
      robot.addresses.some(addr => addr.ip.includes(ipMatch))
    )

  return passName && passIp
}

const createClient = (
  argv: Argv,
  onListChange: (robots: DiscoveryClientRobot[]) => unknown
): DiscoveryClient => {
  const logger = createLogger(argv)
  const { pollInterval, candidates } = argv
  const client = createDiscoveryClient({
    onListChange: robots => onListChange(robots.filter(passesFilters(argv))),
    logger,
  })
  const config = {
    healthPollInterval: pollInterval,
    manualAddresses: candidates.map(ip => ({ ip, port: DEFAULT_PORT })),
  }

  logger.debug('Starting client with config: %o', config)
  client.start(config)

  return client
}

const browse = (argv: Argv): void => {
  const log = createLogger(argv)

  createClient(argv, robots => {
    robots.forEach(robot => {
      log.info('%o\n\n', robot)
    })
  })

  log.warn('Browsing for services')
}

const find = (argv: FindArgv): void => {
  const { name, timeout, ipFilter } = argv
  const log = createLogger(argv)
  const client = createClient(argv, robots => {
    robots
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      .filter(robot => !name || robot.name === name)
      .flatMap<DiscoveryClientRobotAddress>(robot => robot.addresses)
      .filter(
        ({ ip }) =>
          ipFilter.length === 0 ||
          ipFilter.some(ipMatch => ip.includes(ipMatch))
      )
      .forEach(({ ip }) => {
        process.stdout.write(`${ip}\n`)
        process.exit(0)
      })
  })

  log.warn(
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    `Finding ${argv.name ? `robot "${argv.name}"` : 'first available robot'}`
  )

  setTimeout(() => {
    client.stop()
    log.error(`Timed out after ${argv.timeout} ms`)
    process.exitCode = 1
  }, timeout)
}

Yargs.options({
  pollInterval: {
    describe: 'How often the health poller hits every IP address',
    alias: 'p',
    default: 1000,
    type: 'number',
  },
  nameFilter: {
    describe: 'Filter found robots by name',
    alias: 'n',
    default: [],
    type: 'array',
  },
  ipFilter: {
    describe: 'Filter found robots by IP address',
    alias: 'i',
    default: [],
    type: 'array',
  },
  candidates: {
    describe: 'Extra IP addresses to poll outside of mDNS',
    alias: 'c',
    default: [],
    type: 'array',
  },
  logLevel: {
    describe: 'Log level',
    alias: 'l',
    choices: [...LOG_LVLS, 'off'],
    default: 'info',
  },
})
  .env('OT_DC')
  // @ts-expect-error
  .middleware([debugLogArgvMiddleware])
  // @ts-expect-error
  .command(['$0', 'browse'], 'Browse for robots on the network', noop, browse)
  .command(
    'find [name]',
    'Find the IP of a robot by its name',
    // @ts-expect-error
    yargs => {
      yargs.positional('name', {
        describe: 'Name of robot to find; if omitted will find first robot',
        type: 'string',
      })
      yargs.option('timeout', {
        describe: 'How long to wait for a robot',
        alias: 't',
        default: 5000,
        type: 'number',
      })
    },
    find
  )
  .version(_PKG_VERSION_)
  .help()
  .parse()
