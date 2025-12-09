import create from 'zustand';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase-config';

interface AuthState {
  currentUser: User | null;
  loadingAuth: boolean;
  initAuth: () => () => void; // Returns the unsubscribe function
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  loadingAuth: true,

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ currentUser: user, loadingAuth: false });
    });
    return unsubscribe;
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ currentUser: null });
    } catch (error) {
      console.error("Logout Error:", error);
      // Optionally, handle logout errors in the UI, maybe with another store
    }
  },
}));
