module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:tailwindcss/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'import', 'react', 'prettier', 'unused-imports', 'tailwindcss'],
  root: true,
  env: {
    node: true,
    browser: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/no-unresolved': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-key': 'off',
    'react/no-children-prop': 'off',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'prettier/prettier': ['error', { endOfLine: 'auto', semi: true }],
    'tailwindcss/no-custom-classname': 'off'
  },
};
