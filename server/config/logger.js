'use strict'

const chalk = require('chalk')
const ip = require('ip')
const divider = chalk.gray('\n-----------------------------------')
const logger = {
  // Called whenever there's an error on the server we want to print
  error: err => {
    console.error(chalk.red(err))
  },

  // Called when express.js app starts on given port w/o errors
  appStarted: (port, tunnelStarted) => {
    console.log(`Server started ${chalk.green('✓')}`)

    // If the tunnel started, log that and the URL it's available at
    if (tunnelStarted) {
      console.log(`Tunnel initialised ${chalk.green('✓')}`)
    }

    console.log(`
      ${chalk.bold('Access URLs:')}${divider}
      Localhost: ${chalk.green(`http://localhost:${port}`)}
            LAN: ${chalk.green(`http://${ip.address()}:${port}`) +
              (tunnelStarted
                ? `\n    Proxy: ${chalk.magenta(tunnelStarted)}`
                : '')}${divider}
      Welcome to: Ticket Evolution Local Development Server
      ${chalk.blue(`Press ${chalk.italic('CTRL-C')} to stop`)}
    `)
  }
}

module.exports = logger
