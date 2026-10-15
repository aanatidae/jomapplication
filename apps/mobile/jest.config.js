module.exports = {
  preset: 'jest-expo',
  // A regex avoids glob escaping of the exclamation mark in the Windows workspace path.
  testRegex: '__tests__[/\\\\].*\\.test\\.tsx?$',
};
