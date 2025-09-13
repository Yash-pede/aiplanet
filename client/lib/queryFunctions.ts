import api from "./axios";

export const GetWorkflows = async () => {
  const response = await api.get("/workflows");
  return response.data;
};

export const GetWorkflowById = async (id: string) => {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
};

export const GetWorkflowDocument = async (id: string) => {
  const response = await api.get(`/workflows/${id}/documents`);
  return response.data;
};

export const GetEmbeddingModels = async () => {
  const response = await api.get("/metadata/available-embedding-models");
  return response.data;
};

export const CreateSession = async (workflowId: string) => {
  const response = await api.post(`/sessions`, {
    workflow_id: workflowId,
  });
  return response.data;
};
