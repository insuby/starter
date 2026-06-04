// Плоская конфигурация ESLint 9 (см. https://eslint.org/docs/latest/use/configure/).
// Линтит фронтенд (src/). Бэкенд (server/) — отдельный пакет со своей настройкой.
// Тип-зависимые правила намеренно выключены: корневого tsconfig нет, проверка
// синтаксиса/импортов/хуков работает без сервиса типов и потому быстрая.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      'server',
      'docs',
      'scripts',
      '.venv-report',
      '*.config.{js,mjs,cjs,ts}',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // Хуки React — единственная категория, критичная для корректности.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Неиспользуемые импорты убираем (ошибка), переменные — предупреждение.
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // Послабления, согласованные с прежней настройкой проекта.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off', // пустые интерфейсы в UI-примитивах
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
