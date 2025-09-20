module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier', 'react', 'react-hooks'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended', // 将 Prettier 规则作为 ESLint 规则
  ],
  rules: {
    'prettier/prettier': 'error', // 启用 Prettier 作为 ESLint 规则
    '@typescript-eslint/no-explicit-any': 'off',
    'react/react-in-jsx-scope': 'off', // React 17+ 不需要导入 JSX
    'react/prop-types': 'off', // 使用 TypeScript 时不需要 prop-types
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};