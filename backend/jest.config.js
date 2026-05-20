// JUSTIFICACIÓN: Jest + ts-jest para tests TS sin paso previo de compilación.
// runInBand evita conflictos en tests de integración (BBDD compartida).
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**',
  ],
  coverageThreshold: {
    // Objetivo Fase 7: ≥60% backend (rúbrica DAM "testing básico" superado holgadamente)
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
