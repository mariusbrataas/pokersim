// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    worker: true // Add this line to enable worker environment
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'no-restricted-globals': ['error', 'isFinite', 'isNaN'], // Allow 'self'
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/display-name': 'off',
    '@typescript-eslint/no-empty-function': 'off'
  }
};
