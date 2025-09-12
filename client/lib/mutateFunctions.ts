import { Database } from "@/database.types";
import api from "./axios";

export const PostWorkflows = async ({
  name,
  description,
}: Database["public"]["Tables"]["workflows"]["Insert"]) => {
  const response = await api.post("/workflows", { name, description });
  return response.data;
};
