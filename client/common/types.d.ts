import { Database } from "@/database.types";
import { Edge, Node } from "@xyflow/react";

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
    query?: string;
    flow?: {
      nodes: Node[];
      edges: Edge[];
    };
  };
  description: string | null;
  id: string;
  name: string;
  updated_at: string | null;
  user_id: string | null;
};
