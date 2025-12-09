import create from 'zustand';

interface UIState {
  notification: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  notification: null,

  showToast: (message) => {
    set({ notification: message });
    setTimeout(() => {
      set({ notification: null });
    }, 3000);
  },

  hideToast: () => set({ notification: null }),
}));
