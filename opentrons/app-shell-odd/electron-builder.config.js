'use strict'

module.exports = {
  appId: 'com.opentrons.odd',
  electronVersion: '27.0.0',
  npmRebuild: false,
  files: [
    '**/*',
    '!Makefile',
    {
      from: '../app/dist',
      to: './ui',
      filter: ['**/*'],
    },
  ],
  /* eslint-disable no-template-curly-in-string */
  artifactName: '${productName}-v${version}-${os}-${env.BUILD_ID}.${ext}',
  /* eslint-enable no-template-curly-in-string */
  asar: true,
  linux: {
    target: ['dir'],
    executableName: 'opentrons',
    category: 'Science',
  },
}
