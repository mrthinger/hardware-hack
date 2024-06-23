// TODO(mc, 2020-06-11): test all release-files functions
import { vi, describe, it, expect, afterAll } from 'vitest'
import path from 'path'
import { promises as fs } from 'fs'
import fse from 'fs-extra'
import tempy from 'tempy'

import { cleanupReleaseFiles } from '../release-files'
vi.mock('electron-store')
vi.mock('../../log')

describe('system release files utilities', () => {
  const tempDirs: string[] = []
  const makeEmptyDir = (): string => {
    const dir: string = tempy.directory()
    tempDirs.push(dir)
    return dir
  }

  afterAll(async () => {
    await Promise.all(tempDirs.map(d => fse.remove(d)))
  })

  describe('cleanupReleaseFiles', () => {
    it('should leave current version files alone', () => {
      const dir = makeEmptyDir()
      const releaseDir = path.join(dir, '4.0.0')

      return fs
        .mkdir(releaseDir)
        .then(() => cleanupReleaseFiles(dir, '4.0.0'))
        .then(() => fs.readdir(dir))
        .then(files => {
          expect(files).toEqual(['4.0.0'])
        })
    })

    it('should leave support files alone', () => {
      const dir = makeEmptyDir()
      const releaseDir = path.join(dir, '4.0.0')
      const releaseManifest = path.join(dir, 'releases.json')

      return Promise.all([
        fs.mkdir(releaseDir),
        fse.writeJson(releaseManifest, { hello: 'world' }),
      ])
        .then(() => cleanupReleaseFiles(dir, '4.0.0'))
        .then(() => fs.readdir(dir))
        .then(files => {
          expect(files).toEqual(['4.0.0', 'releases.json'])
        })
    })

    it('should delete other directories', () => {
      const dir = makeEmptyDir()
      const releaseDir = path.join(dir, '4.0.0')
      const oldReleaseDir = path.join(dir, '3.9.0')
      const olderReleaseDir = path.join(dir, '3.8.0')

      return Promise.all([
        fs.mkdir(releaseDir),
        fs.mkdir(oldReleaseDir),
        fs.mkdir(olderReleaseDir),
      ])
        .then(() => cleanupReleaseFiles(dir, '4.0.0'))
        .then(() => fs.readdir(dir))
        .then(files => {
          expect(files).toEqual(['4.0.0'])
        })
    })
  })
})
