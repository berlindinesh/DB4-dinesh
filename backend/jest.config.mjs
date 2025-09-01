export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "json", "node"],
  roots: ["<rootDir>"],   // 👈 ensure Jest knows tests live inside backend
  moduleDirectories: ["node_modules", "<rootDir>"], // 👈 allows absolute paths from backend/
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "config/**/*.js",
    "Jobs/**/*.js",
    "!node_modules/**",
    "!coverage/**",
    "!tests/**",
    "!server.js"
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000
};
