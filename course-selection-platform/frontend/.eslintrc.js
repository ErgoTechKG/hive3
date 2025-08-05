module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'build/', 'node_modules/', 'public/'],
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
  },
};