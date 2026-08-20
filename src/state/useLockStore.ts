import { create } from 'zustand';

interface LockState {
  /** True until the security gate (PIN/biometric) is built in Slice 2 — app starts unlocked. */
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useLockStore = create<LockState>()((set) => ({
  isUnlocked: true,
  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false }),
}));
