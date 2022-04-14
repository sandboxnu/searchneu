module.exports = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.svg$': 'jest-svg-transformer',
    '^.+\\.yml$': '<rootDir>/node_modules/yaml-jest',
  },
  moduleNameMapper: {
    '^.+\\.(css|less)$': '<rootDir>/__mocks__/style.js',
  },
};
