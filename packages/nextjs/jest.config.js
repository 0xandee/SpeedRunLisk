/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  projects: [
    {
      displayName: "api",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__tests__/api/**/*.test.{ts,tsx}"],
      moduleNameMapping: {
        "^~~/(.*)$": "<rootDir>/$1",
      },
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
      },
    },
    {
      displayName: "components",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/__tests__/components/**/*.test.{ts,tsx}"],
      moduleNameMapping: {
        "^~~/(.*)$": "<rootDir>/$1",
      },
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts", "<rootDir>/jest.setup-react.ts"],
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
      },
    },
  ],
  testTimeout: 10000,
  collectCoverageFrom: [
    "app/api/**/*.ts",
    "app/_components/**/*.{ts,tsx}",
    "services/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

module.exports = config;
