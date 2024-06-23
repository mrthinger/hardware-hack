import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'

import nameSpecsSchema from '../../pipette/schemas/1/pipetteNameSpecsSchema.json'
import modelSpecsSchema from '../../pipette/schemas/1/pipetteModelSpecsSchema.json'
import pipetteNameSpecs from '../../pipette/definitions/1/pipetteNameSpecs.json'
import pipetteModelSpecs from '../../pipette/definitions/1/pipetteModelSpecs.json'

const ajv = new Ajv({ allErrors: true, jsonPointers: true })

const validateNameSpecs = ajv.compile(nameSpecsSchema)
const validateModelSpecs = ajv.compile(modelSpecsSchema)

describe('validate pipette specs with JSON schemas', () => {
  it('ensure all pipette *NAME* specs match name JSON schema', () => {
    const valid = validateNameSpecs(pipetteNameSpecs)
    const validationErrors = validateNameSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })

  it('ensure all pipette *MODEL* specs match model JSON schema', () => {
    const valid = validateModelSpecs(pipetteModelSpecs)
    const validationErrors = validateModelSpecs.errors

    if (validationErrors) {
      console.log(JSON.stringify(validationErrors, null, 4))
    }

    expect(validationErrors).toBe(null)
    expect(valid).toBe(true)
  })
})

describe('model -> name referencing', () => {
  it('ensure all pipette model specs reference a valid pipette name', () => {
    const modelConfigs = Object.values(pipetteModelSpecs.config)
    const nameKeys = Object.keys(pipetteNameSpecs)

    modelConfigs.forEach(config => {
      const nameForVersion = config.name
      expect(nameKeys).toContain(nameForVersion)
    })
  })
})
