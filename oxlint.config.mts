import amamo from '@amamo/oxlint-config'

export default amamo({
  node: true,
  react: true,
  rules: {
    'import/no-unassigned-import': ['warn', { allow: ['**/*.css'] }],
    'react/react-in-jsx-scope': 'off',
    'vitest/expect-expect': 'off',
    'no-await-in-loop': 'off',
    'promise/no-callback-in-promise': 'off',
    'promise/always-return': 'off',
    'unicorn/consistent-function-scoping': 'off',
  },
  test: 'vitest',
})
