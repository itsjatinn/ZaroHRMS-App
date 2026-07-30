import * as SecureStore from 'expo-secure-store';

// Native: back auth persistence with the device keychain / keystore. The web
// build resolves secureStorage.web.ts (localStorage) instead.
export async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
