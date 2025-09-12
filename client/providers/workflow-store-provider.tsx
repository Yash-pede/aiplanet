"use client";

import {
  createContext,
  useRef,
  useContext,
  type ReactNode,
} from "react";
import { useStore } from "zustand";

import {
  type WorkflowStore,
  createWorkflowStore,
} from "@/lib/store/workflowStore";

export type WorkflowStoreApi = ReturnType<typeof createWorkflowStore>;

const WorkflowStoreContext = createContext<WorkflowStoreApi | undefined>(
  undefined
);

export function WorkflowStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const storeRef = useRef<WorkflowStoreApi>(null);

  if (!storeRef.current) {
    storeRef.current = createWorkflowStore();
  }

  return (
    <WorkflowStoreContext.Provider value={storeRef.current}>
      {children}
    </WorkflowStoreContext.Provider>
  );
}

export function useWorkflowStore<T>(selector: (state: WorkflowStore) => T): T {
  const store = useContext(WorkflowStoreContext);
  if (!store) {
    throw new Error("useWorkflowStore must be used within WorkflowStoreProvider");
  }
  return useStore(store, selector);
}
