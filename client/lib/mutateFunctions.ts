import { Database } from "@/database.types";
import { Workflow } from "@/common/types";
import api from "@/utils/axios";

export const PostWorkflows = async ({
  name,
  description,
}: Database["public"]["Tables"]["workflows"]["Insert"]) => {
  const response = await api.post("/workflows", { name, description });
  return response.data;
};

export const UpdateWorkflow = async ({
  id,
  name,
  description,
  definition,
}: Workflow) => {
  const response = await api.put(`/workflows/${id}`, {
    name,
    description,
    definition,
  });
  console.log("Update WRKFLOW: " ,JSON.stringify({ name, description, definition }, null, 2));
  return response.data;
};

export const ExecuteWorkflow = async (id: string) => {
  const response = await api.post(`/workflows/${id}/execute`);
  return response.data;
};

export const CreateSession = async (workflowId: string) => {
  const response = await api.post(`/sessions`, {
    workflow_id: workflowId,
  });
  return response.data;
};