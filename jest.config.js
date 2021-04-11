module.exports = {
  // coverageReporters: ['text', 'cobertura', 'lcov'],
  moduleDirectories: ['./node_modules', './'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx,js}'],
  testEnvironment: "node",
  modulePathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist'],
}
