/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  // uuid v14+ ships only ESM distributions; Jest runs in CommonJS mode.
  // We redirect 'uuid' to a tiny hand-written CJS shim so that User.js can
  // call require('uuid') without hitting a SyntaxError on 'export'.
  moduleNameMapper: {
    '^uuid$': '<rootDir>/__mocks__/uuid.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js',
    '**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js',
    '!src/start.js',
  ],
  coverageThreshold: {
    global: {
      branches: 2,
      functions: 0,
      lines: 4,
      statements: 4,
    },
  },
  forceExit: true,
};



module.exports = config;
