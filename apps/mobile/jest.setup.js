/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
process.env.EXPO_PUBLIC_DATA_MODE = 'local';
