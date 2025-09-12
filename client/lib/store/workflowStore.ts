import { createStore } from "zustand/vanilla";
import { Workflow } from "@/common/types";

type WorkflowState = {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
};

type WorkflowActions = {
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  selectWorkflow: (workflow: Workflow | null) => void;
  getWorkflow: (id: string) => void;
  updateSelectedWorkflow: (def: Partial<Workflow>) => void;
  updateSelectedWorkflowDefinition: (
    workflow: Partial<Workflow["definition"]>
  ) => void;
};

export type WorkflowStore = WorkflowState & WorkflowActions;

export const defaultWorkflowState: WorkflowState = {
  workflows: [],
  selectedWorkflow: null,
};

export const createWorkflowStore = (
  initState: WorkflowState = defaultWorkflowState
) => {
  return createStore<WorkflowStore>()((set) => ({
    ...initState,

    setWorkflows: (workflows) => set({ workflows }),

    addWorkflow: (workflow) =>
      set((state) => ({ workflows: [...state.workflows, workflow] })),

    updateWorkflow: (workflow) =>
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === workflow.id ? workflow : w
        ),
      })),

    deleteWorkflow: (id) =>
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
      })),

    selectWorkflow: (workflow) => set({ selectedWorkflow: workflow }),

    getWorkflow: (id) =>
      set((state) => ({
        selectedWorkflow: state.workflows.find((w) => w.id === id) ?? null,
      })),
    updateSelectedWorkflowDefinition: (def) =>
      set((state) => {
        if (!state.selectedWorkflow) return { selectedWorkflow: null };

        return {
          selectedWorkflow: {
            ...state.selectedWorkflow,
            definition: {
              ...state.selectedWorkflow.definition,
              ...def,
            },
          },
        };
      }),

    updateSelectedWorkflow: (workflow) =>
      set((state) => ({
        selectedWorkflow: state.selectedWorkflow
          ? { ...state.selectedWorkflow, ...workflow }
          : null,
      })),
  }));
};
