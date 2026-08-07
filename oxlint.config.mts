import amamo from '@amamo/oxlint-config'

export default amamo(
  {
    node: true,
    react: true,
    rules: {
      'react/react-in-jsx-scope': 'off',
      'vitest/expect-expect': 'off',
    },
    test: 'vitest',
  },
  {
    overrides: [
      {
        files: ['src/build.ts', 'src/dev.ts'],
        rules: {
          'no-await-in-loop': 'off',
        },
      },
      {
        files: ['src/dev.ts'],
        rules: {
          'promise/no-callback-in-promise': 'off',
        },
      },
      {
        files: ['src/runtime/app.tsx'],
        rules: {
          'promise/always-return': 'off',
          'unicorn/consistent-function-scoping': 'off',
        },
      },
      {
        files: ['src/runtime/entry-client.tsx', 'src/runtime/entry-server.tsx'],
        rules: {
          'import/no-unassigned-import': 'off',
        },
      },
    ],
  },
)
