/** Ensure that the deck schema itself functions as intended,
 *  and that all v4 protocol fixtures will validate */
import Ajv from 'ajv'
import path from 'path'
import glob from 'glob'
import { describe, expect, it } from 'vitest'
import deckSchema from '../../deck/schemas/3.json'
import deckSchemaV4 from '../../deck/schemas/4.json'

const fixtureGlob = path.join(__dirname, '../../deck/fixtures/3/*.json')
const defGlob = path.join(__dirname, '../../deck/definitions/3/*.json')
const defV4Glob = path.join(__dirname, '../../deck/definitions/4/*.json')

const ajv = new Ajv({ allErrors: true, jsonPointers: true })

const validateSchema = ajv.compile(deckSchema)
const validateSchemaV4 = ajv.compile(deckSchemaV4)

describe('validate v3 deck defs and fixtures', () => {
  const fixtures = glob.sync(fixtureGlob)

  fixtures.forEach(fixturePath => {
    const fixtureDef = require(fixturePath)

    it('fixture validates against schema', () => {
      const valid = validateSchema(fixtureDef)
      const validationErrors = validateSchema.errors

      if (validationErrors) {
        console.log(
          path.parse(fixturePath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })

  const defs = glob.sync(defGlob)

  defs.forEach(defPath => {
    const deckDef = require(defPath)

    it('deck validates against v3 schema', () => {
      const valid = validateSchema(deckDef)
      const validationErrors = validateSchema.errors

      if (validationErrors) {
        console.log(
          path.parse(defPath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
})

describe('validate v4 deck defs', () => {
  const defs = glob.sync(defV4Glob)

  defs.forEach(defPath => {
    const deckDef = require(defPath)

    it('deck validates against v4 schema', () => {
      const valid = validateSchemaV4(deckDef)
      const validationErrors = validateSchemaV4.errors

      if (validationErrors) {
        console.log(
          path.parse(defPath).base +
            ' ' +
            JSON.stringify(validationErrors, null, 4)
        )
      }

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
})
