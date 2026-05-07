import {
  collectInactiveOneOfBranchPaths,
  collectOneOfBranchMatchKeys,
  matchesOneOfBranch,
  toOneOfBranchPath,
} from './oneOfBranch'

describe('oneOf branch helpers', () => {
  test('matches boolean false branch values without treating them as absent', () => {
    expect(matchesOneOfBranch({ enabled: false }, { match: { enabled: false } })).toBe(true)
    expect(matchesOneOfBranch({ enabled: undefined }, { match: { enabled: false } })).toBe(false)
  })

  test('matches numeric branch values strictly', () => {
    expect(matchesOneOfBranch({ count: 3 }, { match: { count: 3 } })).toBe(true)
    expect(matchesOneOfBranch({ count: '3' }, { match: { count: 3 } })).toBe(false)
  })

  test('does not match branches without explicit match entries', () => {
    expect(matchesOneOfBranch({ type: 'service' }, { required: ['service'] })).toBe(false)
  })

  test('normalizes dotted branch paths', () => {
    expect(toOneOfBranchPath('spec.selector.type')).toEqual(['spec', 'selector', 'type'])
  })

  test('collects unique branch match keys', () => {
    expect(
      collectOneOfBranchMatchKeys([
        { match: { type: 'service' }, required: ['service'] },
        { match: { type: 'url' }, required: ['url'] },
        { match: { mode: 'direct' }, required: ['direct'] },
      ]),
    ).toEqual(['type', 'mode'])
  })

  test('collects inactive branch paths while keeping active match and required paths visible', () => {
    const serviceBranch = { match: { type: 'service' }, required: ['service'], forbidden: ['url'] }
    const urlBranch = { match: { type: 'url' }, required: ['url'], forbidden: ['service'] }

    expect(
      collectInactiveOneOfBranchPaths({
        branches: [serviceBranch, urlBranch],
        activeBranch: serviceBranch,
      }),
    ).toEqual([['url']])
  })
})
