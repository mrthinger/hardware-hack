import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'
import { versionForProject } from '../scripts/git-version.mjs'
import type { UserConfig } from 'vite'

export default defineConfig(
  async(): Promise<UserConfig> => {
    const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'
    const version = await versionForProject(project)
    return {
      // this makes imports relative rather than absolute
      base: '',
      build: {
        // Relative to the root
        outDir: 'dist',
      },
      plugins: [
        react({
          include: '**/*.tsx',
          babel: {
            // Use babel.config.js files
            configFile: true,
          },
        }),
      ],
      optimizeDeps: {
        esbuildOptions: {
          target: 'es2020',
        },
      },
      css: {
        postcss: {
          plugins: [
            postCssImport({ root: 'src/' }),
            postCssApply(),
            postColorModFunction(),
            postCssPresetEnv({ stage: 0 }),
            lostCss(),
          ],
        },
      },
      define: {
        'process.env': process.env,
        global: 'globalThis',
        _PKG_VERSION_: JSON.stringify(version),
        _OPENTRONS_PROJECT_: JSON.stringify(project),
      },
      resolve: {
        alias: {
          '@opentrons/components/styles': path.resolve(
            '../components/src/index.module.css'
          ),
          '@opentrons/components': path.resolve('../components/src/index.ts'),
          '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
          '@opentrons/step-generation': path.resolve(
            '../step-generation/src/index.ts'
          ),
          '@opentrons/api-client': path.resolve('../api-client/src/index.ts'),
          '@opentrons/react-api-client': path.resolve(
            '../react-api-client/src/index.ts'
          ),
        },
      },
    }
  })
