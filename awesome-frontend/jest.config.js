module.exports = {
  testEnvironment: "jsdom",
  transform: {
    '.(ts|tsx)': '@swc/jest',
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testMatch: ['**/?(*.)(spec|test).ts?(x)'],
//   moduleNameMapper: {
//     '^@utils(.*)$': '<rootDir>/src/utils$1',
//   },
//   coverageThreshold: {
//     global: {
//       branches: 50,
//       functions: 95,
//       lines: 95,
//       statements: 95,
//     },
//   },
//   watchAll: false,
//   collectCoverage: true,
//   coverageDirectory: './docs/jest-coverage',
//   coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};
