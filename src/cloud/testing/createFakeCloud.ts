import { vi } from 'vitest';
import type { DXCUserInteraction, SyncState, UserLogin } from 'dexie-cloud-addon';
import { createFakeSubject } from './createFakeSubject';

export function createFakeCloud(user: Partial<UserLogin> = {}, syncState: Partial<SyncState> = {}) {
  return {
    currentUser: createFakeSubject<UserLogin>({ claims: {}, lastLogin: new Date(0), ...user }),
    syncState: createFakeSubject<SyncState>({ status: 'connected', phase: 'in-sync', ...syncState }),
    userInteraction: createFakeSubject<DXCUserInteraction | undefined>(undefined),
    login: vi.fn(() => Promise.resolve()),
    logout: vi.fn(() => Promise.resolve()),
    getAuthProviders: vi.fn(() =>
      Promise.resolve({ providers: [{ type: 'google' as const, name: 'google', displayName: 'Google' }], otpEnabled: false }),
    ),
  };
}
