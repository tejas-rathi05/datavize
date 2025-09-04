import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";

type ContextSidebarSettings = { disabled: boolean };
type ContextSidebarStore = {
  isOpen: boolean;
  contextType: string | null;
  settings: ContextSidebarSettings;
  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
  openContext: (contextType: string) => void;
  closeContext: () => void;
  setSettings: (settings: Partial<ContextSidebarSettings>) => void;
};

export const useContextSidebar = create(
  persist<ContextSidebarStore>(
    (set, get) => ({
      isOpen: false,
      contextType: null,
      settings: { disabled: false },
      toggleOpen: () => {
        set({ isOpen: !get().isOpen });
      },
      setIsOpen: (isOpen: boolean) => {
        set({ isOpen });
      },
      openContext: (contextType: string) => {
        set({ isOpen: true, contextType });
      },
      closeContext: () => {
        set({ isOpen: false, contextType: null });
      },
      setSettings: (settings: Partial<ContextSidebarSettings>) => {
        set(
          produce((state: ContextSidebarStore) => {
            state.settings = { ...state.settings, ...settings };
          })
        );
      }
    }),
    {
      name: "context-sidebar",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
