import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'glass';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove('dark', 'glass');
  if (theme === 'dark') html.classList.add('dark');
  if (theme === 'glass') html.classList.add('glass');
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      cycleTheme: () => {
        const order: Theme[] = ['light', 'dark', 'glass'];
        const next = order[(order.indexOf(get().theme) + 1) % order.length];
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'recruit-pro-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);
