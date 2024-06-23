import { describe, it, expect } from 'vitest'
import { getIfConsistent, getSpacingIfUniform } from '../labwareInference'

describe('getSpacingIfUniform', () => {
  const testCases = [
    {
      testLabel: '1 well case: return 0',
      wells: [{ x: 10 }],
      expected: 0,
    },
    {
      testLabel: '2 well case',
      wells: [{ x: 10 }, { x: 20 }],
      expected: 10,
    },
    {
      testLabel:
        '2 well case with overlapping wells (eg, single-column labware): return 0',
      wells: [{ x: 10 }, { x: 10 }],
      expected: 0,
    },
    {
      testLabel: '3 well case',
      wells: [{ x: 0 }, { x: 25 }, { x: 50 }],
      expected: 25,
    },
    {
      testLabel:
        '3 well case with overlapping wells (eg, single-column labware): return 0',
      wells: [{ x: 10 }, { x: 10 }, { x: 10 }],
      expected: 0,
    },
    {
      testLabel: '3 well case: out of order is non-uniform, return null',
      wells: [{ x: 50 }, { x: 0 }, { x: 25 }],
      expected: null,
    },
    {
      testLabel: '3 well case: non-uniform with some duplicate values',
      wells: [
        { x: 0 },
        { x: 25 },
        { x: 25, spam: 'spam' },
        { x: 50 },
        { x: 50, foo: 'foo' },
      ],
      expected: 25,
    },
    {
      testLabel: 'returns null if wells have irregular spacing',
      wells: [{ x: 10 }, { x: 20 }, { x: 21 }],
      expected: null,
    },
    {
      testLabel: 'returns 0 with no wells',
      wells: [],
      expected: 0,
    },
  ]
  testCases.forEach(({ wells, expected, testLabel }) =>
    it(testLabel, () =>
      expect(getSpacingIfUniform(wells as any[], 'x')).toBe(expected)
    )
  )
})

describe('getIfConsistent', () => {
  it('deep equal', () => {
    const items = [
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [3]] },
    ]
    expect(getIfConsistent(items)).toEqual(items[0])
  })

  it('deep difference', () => {
    const items = [
      { a: 123, b: [1, 2, [3]] },
      { a: 123, b: [1, 2, [999999]] },
      { a: 123, b: [1, 2, [3]] },
    ]
    expect(getIfConsistent(items)).toBe(null)
  })
})
