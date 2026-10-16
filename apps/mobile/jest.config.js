module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // A regex avoids glob escaping of the exclamation mark in the Windows workspace path.
  testRegex: '__tests__[/\\\\].*\\.test\\.tsx?$',
};
