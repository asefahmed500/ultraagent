import { createStore } from "zustand/vanilla";
import type { RunDTO } from "@/lib/types";

export interface UIState {
  commandBarOpen: boolean;
  sidebarCollapsed: boolean;
  activeFilter: string;
  notificationsOpen: boolean;
  setCommandBarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveFilter: (filter: string) => void;
  setNotificationsOpen: (open: boolean) => void;
}

export function createUIStore() {
  return createStore<UIState>()((set) => ({
    commandBarOpen: false,
    sidebarCollapsed: false,
    activeFilter: "all",
    notificationsOpen: false,
    setCommandBarOpen: (commandBarOpen) => set({ commandBarOpen }),
    toggleSidebar: () =>
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setActiveFilter: (activeFilter) => set({ activeFilter }),
    setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  }));
}

export interface RunPlayerState {
  run: RunDTO | null;
  playing: boolean;
  lastAction: string;
  setRun: (run: RunDTO) => void;
  setPlaying: (playing: boolean) => void;
  setLastAction: (action: string) => void;
  reset: () => void;
}

export function createRunPlayerStore() {
  return createStore<RunPlayerState>()((set) => ({
    run: null,
    playing: false,
    lastAction: "",
    setRun: (run) => set({ run }),
    setPlaying: (playing) => set({ playing }),
    setLastAction: (lastAction) => set({ lastAction }),
    reset: () => set({ run: null, playing: false, lastAction: "" }),
  }));
}

export type UIStore = ReturnType<typeof createUIStore>;
export type RunPlayerStore = ReturnType<typeof createRunPlayerStore>;
