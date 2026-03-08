import { beforeEach, afterEach, vi } from 'vitest';
import { chromeMock, resetChromeMocks } from './mocks/chrome';

global.chrome = chromeMock as unknown as typeof chrome;
global.fetch = vi.fn();

beforeEach(() => {
  resetChromeMocks();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
