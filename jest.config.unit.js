module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/unit/**/*.test.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/services/**/*.ts'],
};