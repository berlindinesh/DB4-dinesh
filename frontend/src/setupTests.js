// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-location-mock';

// Mock Redux persist
jest.mock('redux-persist', () => ({
  persistStore: jest.fn(),
  persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
  FLUSH: 'persist/FLUSH',
  REHYDRATE: 'persist/REHYDRATE',
  PAUSE: 'persist/PAUSE',
  PERSIST: 'persist/PERSIST',
  PURGE: 'persist/PURGE',
  REGISTER: 'persist/REGISTER'
}));

// Mock Redux toolkit
jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  configureStore: jest.fn().mockImplementation((config) => {
    const store = jest.requireActual('@reduxjs/toolkit').configureStore(config);
    store.persist = jest.fn();
    return store;
  })
}));

// Mock CSS modules
jest.mock('*.module.css', () => ({}), { virtual: true });
