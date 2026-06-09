module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // JUSTIFICACIÓN: por la regla de oro del proyecto los hooks se nombran en castellano
    // (usarSesion, usarCarrito, usarCatalogo…). El plugin react-hooks detecta los hooks por el
    // prefijo inglés `use` (regex hardcodeada), así que no reconoce `usar*` y marca falsos
    // positivos de "rules-of-hooks". Se desactiva esa regla concreta; mantenemos
    // `exhaustive-deps` (independiente del nombre) para seguir validando dependencias.
    'react-hooks/rules-of-hooks': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
};
