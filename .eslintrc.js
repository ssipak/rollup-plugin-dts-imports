module.exports = {
  plugins: ['@typescript-eslint'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    env: { es6: true },
    sourceType: 'module'
  },
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'standard'
  ],
  rules: {
    semi: ['warn', 'always']
  },
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    }
  ]
};
