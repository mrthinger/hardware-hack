import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

import { promisify } from 'util'
import express from 'express'
import multer from 'multer'
import portfinder from 'portfinder'
import fetch from 'node-fetch'
import FormData from 'form-data'

import { robotApiUrl, fetchRobotApi } from '../http'
import { HTTP_API_VERSION, GET, POST, PATCH, DELETE } from '../constants'

import type { Application } from 'express'
import type { RobotHost } from '../types'

vi.unmock('node-fetch')

describe('robot-api http client', () => {
  let testApp: Application
  let testServer: any
  let testPort: number
  let robot: RobotHost

  beforeAll(() => {
    ;(global as any).fetch = fetch
    testApp = express()
    testApp.use((express as any).json())

    return portfinder.getPortPromise({ port: 31950 }).then(port => {
      testPort = port
      robot = { name: 'robot-name', ip: '127.0.0.1', port }

      return new Promise<void>((resolve, reject) => {
        const server = testApp.listen(port)

        if (server) {
          const handleListening = () => {
            server.removeListener('error', handleError)
            resolve()
          }

          const handleError = (error: Error) => {
            server.removeListener('listening', handleListening)
            reject(error)
          }

          testServer = server
          server.once('listening', handleListening)
          server.once('error', handleError)
        }
      })
    })
  })

  afterAll(() => {
    // @ts-expect-error(sa, 2021-6-28): can't delete non optional properties
    delete global.fetch

    if (testServer) {
      const close = promisify(testServer.close.bind(testServer))
      return close()
    }
  })

  it('can form a valid robot URL', () => {
    const url = robotApiUrl(robot, { method: GET, path: '/health' })

    expect(url).toEqual(`http://127.0.0.1:${testPort}/health`)
  })

  it('can form a valid robot URL with query params', () => {
    const url = robotApiUrl(robot, {
      method: GET,
      path: '/health',
      query: { refresh: true, meaning: 42 },
    })

    expect(url).toEqual(
      `http://127.0.0.1:${testPort}/health?refresh=true&meaning=42`
    )
  })

  it('removes any empty query params', () => {
    const url = robotApiUrl(robot, {
      method: GET,
      path: '/health',
      query: {
        emptyParam: '',
        nullParam: null,
        voidParam: undefined,
        falseParam: false,
      },
    })
    expect(url).toEqual(`http://127.0.0.1:${testPort}/health?falseParam=false`)
  })

  it('can make a get request', () => {
    testApp.get('/health', (req, res) => {
      res.status(200).send('{ "hello": "world" }')
    })

    const result = fetchRobotApi(robot, {
      method: GET,
      path: '/health',
    }).toPromise()

    return expect(result).resolves.toEqual({
      host: robot,
      method: GET,
      path: '/health',
      body: { hello: 'world' },
      status: 200,
      ok: true,
    })
  })

  it('resolves with ok: false on non-2xx', () => {
    testApp.get('/not-found', (req, res) => {
      res.status(404).send('{ "message": "not found" }')
    })

    const result = fetchRobotApi(robot, {
      method: GET,
      path: '/not-found',
    }).toPromise()

    return expect(result).resolves.toEqual({
      host: robot,
      method: GET,
      path: '/not-found',
      body: { message: 'not found' },
      status: 404,
      ok: false,
    })
  })

  it('can POST a JSON body', () => {
    testApp.post('/post-echo', (req, res) => {
      res.status(201).send(req.body)
    })

    const result = fetchRobotApi(robot, {
      method: POST,
      path: '/post-echo',
      body: { hello: { from: 'the', other: 'side' } },
    }).toPromise()

    return expect(result).resolves.toEqual({
      host: robot,
      method: POST,
      path: '/post-echo',
      body: { hello: { from: 'the', other: 'side' } },
      status: 201,
      ok: true,
    })
  })

  it('can PATCH a JSON body', () => {
    testApp.patch('/patch-echo', (req, res) => {
      res.status(200).send(req.body)
    })

    const result = fetchRobotApi(robot, {
      method: PATCH,
      path: '/patch-echo',
      body: { i: { must: 'have' }, called: { '1000': 'times' } },
    }).toPromise()

    return expect(result).resolves.toEqual({
      host: robot,
      method: PATCH,
      path: '/patch-echo',
      body: { i: { must: 'have' }, called: { '1000': 'times' } },
      status: 200,
      ok: true,
    })
  })

  it('can make a DELETE request', () => {
    testApp.delete('/thing-to-delete', (req, res) => {
      res.status(200).send('{}')
    })

    const result = fetchRobotApi(robot, {
      method: DELETE,
      path: '/thing-to-delete',
    }).toPromise()

    return expect(result).resolves.toEqual({
      host: robot,
      method: DELETE,
      path: '/thing-to-delete',
      body: {},
      status: 200,
      ok: true,
    })
  })

  it('can POST a multipart body', () => {
    testApp.post(
      '/file',
      multer({ storage: multer.memoryStorage() }).any(),
      (req, res) => {
        const files = (req as any).files ?? []

        res.status(201).send({
          files: files.map((f: any) => ({
            key: f.fieldname,
            filename: f.originalname,
            contents: f.buffer.toString('utf-8'),
          })),
        })
      }
    )

    const form = new FormData() as any
    form.append('file1', Buffer.from('lorem ipsum') as any, '1.txt')
    form.append('file2', Buffer.from('dolor sit amet') as any, '2.txt')

    const result = fetchRobotApi(robot, {
      method: POST,
      path: '/file',
      form,
    }).toPromise()

    return expect(result).resolves.toEqual({
      host: robot,
      method: POST,
      path: '/file',
      body: {
        files: [
          { key: 'file1', filename: '1.txt', contents: 'lorem ipsum' },
          { key: 'file2', filename: '2.txt', contents: 'dolor sit amet' },
        ],
      },
      status: 201,
      ok: true,
    })
  })

  it('adds the Opentrons-Version header', () => {
    testApp.get('/version', (req, res) => {
      const version: any = req.header('Opentrons-Version')
      res.status(200).send(`{ "version": "${version}" }`)
    })

    const result = fetchRobotApi(robot, {
      method: GET,
      path: '/version',
    }).toPromise()

    expect(HTTP_API_VERSION).toEqual(expect.any(Number))

    return expect(result).resolves.toEqual({
      host: robot,
      method: GET,
      path: '/version',
      body: { version: `${HTTP_API_VERSION}` },
      status: 200,
      ok: true,
    })
  })
})
