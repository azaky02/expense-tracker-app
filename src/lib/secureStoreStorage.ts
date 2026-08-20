import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

/** Zustand persist storage adapter backed by the OS keychain/keystore via expo-secure-store. */
export const secureStoreStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};
