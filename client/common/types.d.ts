import { Database } from "@/database.types";

export type CustomNode = {
  title: string;
  type: string;
  icon: any;
  description: string;
  width: number;
  height: number;
};

export type Workflow = {
  created_at: string;
  definition: {
    documentUrl?: Database["public"]["Tables"]["documents"]["Row"];
    embeddingModel?: string;
    llmModel?: string;
    prompt?: string;
    temperature?: number;
  };
  description: string | null;
  id: string;
  name: string;
  updated_at: string | null;
  user_id: string | null;
};
