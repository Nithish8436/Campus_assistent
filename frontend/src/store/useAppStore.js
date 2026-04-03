import { create } from "zustand";

export const useAppStore = create((set) => ({
  activeFileIds: [],
  setActiveFileIds: (ids) => set({ activeFileIds: ids }),
  addActiveFileIds: (ids) => set((state) => ({ 
    activeFileIds: [...new Set([...state.activeFileIds, ...ids])] 
  }))
}));
