/** @type {import('jest').Config} */
module.exports = {
  displayName: 'Backend Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/src', '<rootDir>/backend/tests'],
  testMatch: [
    '**/__tests__/**/*.test.(ts|js)',
    '**/**/*.test.(ts|js)',
    '**/**/*.spec.(ts|js)'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'html', 'lcov', 'clover'],
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/**/*.d.ts',
    '!backend/src/types/**/*',
    '!backend/src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
    '^@tests/(.*)$': '<rootDir>/backend/tests/$1'
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  resetModules: true
};