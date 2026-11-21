"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createRunPlayerStore,
  createUIStore,
  type RunPlayerState,
  type UIState,
  type RunPlayerStore,
  type UIStore,
} from "@/stores";

const UIContext = createContext<UIStore | null>(null);
const RunContext = createContext<RunPlayerStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [uiStore] = useState(createUIStore);
  const [runStore] = useState(createRunPlayerStore);
  return (
    <UIContext.Provider value={uiStore}>
      <RunContext.Provider value={runStore}>{children}</RunContext.Provider>
    </UIContext.Provider>
  );
}

export function useUI<T>(selector: (state: UIState) => T): T {
  const store = useContext(UIContext);
  if (!store) throw new Error("useUI must be used inside StoreProvider");
  return useStore(store, selector);
}

export function useRunPlayer<T>(selector: (state: RunPlayerState) => T): T {
  const store = useContext(RunContext);
  if (!store) throw new Error("useRunPlayer must be used inside StoreProvider");
  return useStore(store, selector);
}
