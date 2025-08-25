export default {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'config/**/*.js',
    'Jobs/**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**',
    '!server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  testTimeout: 30000
};
