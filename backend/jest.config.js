export default {
  transform: {},
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@pklinks/config$': '<rootDir>/packages/config/index.js',
    '^@pklinks/utils/(.*)$': '<rootDir>/packages/utils/$1'
  },
  clearMocks: true,
  testMatch: ['**/*.test.js']
};
