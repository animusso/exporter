import { vi } from 'vitest';

export interface MockStorage {
  [key: string]: unknown;
}

const localStorageMock: MockStorage = {};

export const chromeMock: any = {
  runtime: {
    lastError: undefined as chrome.runtime.LastError | undefined,
    sendMessage: vi.fn((_message: unknown, callback?: (response: unknown) => void) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
  },

  storage: {
    local: {
      get: vi.fn((keys: string | string[] | null, callback?: (items: MockStorage) => void) => {
        const result: MockStorage = {};
        if (keys === null) {
          Object.assign(result, localStorageMock);
        } else if (typeof keys === 'string') {
          if (keys in localStorageMock) {
            result[keys] = localStorageMock[keys];
          }
        } else if (Array.isArray(keys)) {
          keys.forEach((key) => {
            if (key in localStorageMock) {
              result[key] = localStorageMock[key];
            }
          });
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: vi.fn((items: MockStorage, callback?: () => void) => {
        Object.assign(localStorageMock, items);
        if (callback) callback();
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[], callback?: () => void) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach((key) => delete localStorageMock[key]);
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: vi.fn((callback?: () => void) => {
        Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },

  tabs: {
    create: vi.fn((_props: { url: string }) => {
      return Promise.resolve({ id: 1 });
    }),
  },

  downloads: {
    download: vi.fn((_options: unknown, callback?: (downloadId: number) => void) => {
      if (callback) callback(1);
    }),
  },

  webRequest: {
    onBeforeSendHeaders: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
  },
};

export function resetChromeMocks(): void {
  Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
  vi.clearAllMocks();
  chromeMock.runtime.lastError = undefined;
}

export function setLocalStorageMock(data: MockStorage): void {
  Object.assign(localStorageMock, data);
}
