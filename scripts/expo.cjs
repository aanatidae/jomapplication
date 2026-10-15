// Resolve Expo from the mobile workspace whether npm nests or hoists dependencies.
const path = require('node:path');
const mobileDirectory = path.resolve(__dirname, '../apps/mobile');
const expoDirectory = path.dirname(
  require.resolve('expo/package.json', { paths: [mobileDirectory] }),
);
process.chdir(mobileDirectory);
require(path.join(expoDirectory, 'bin/cli'));
