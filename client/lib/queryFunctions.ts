import api from "@/utils/axios";

export const GetWorkflows = async () => {
  const response = await api.get("/workflows");
  return response.data;
};

export const GetWorkflowById = async (id: string) => {
  const response = await api.get(`/workflows/${id}`);
  console.log("GET WORKFLOW BY ID: ", JSON.stringify(response.data));
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


export const GetLLMModels = async () => {
  const response = await api.get("/metadata/available-llm-models");
  return response.data;
};

export const ListSessionsByWorkflowId = async (workflowId: string) => {
  console.log("LIST SESSIONS BY WORKFLOW ID: ", workflowId);
  const response = await api.get(`/workflows/${workflowId}/sessions`);
  return response.data;
};

export const GetAllMessagesBySessionId = async (sessionId: string) => {
  const response = await api.get(`/sessions/${sessionId}/messages`);
  return response.data;
};