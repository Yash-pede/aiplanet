"use client";
import React from "react";
import NodeWrapper from "./NodeWrapper";
import { NodeProps } from "@xyflow/react";
import { CardContent } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { GetEmbeddingModels } from "@/lib/queryFunctions";

const KnowledgeBaseNode = (props: NodeProps) => {
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const updateSelectedWorkflowDefinition = useWorkflowStore(
    (s) => s.updateSelectedWorkflowDefinition
  );
  const { data: embeddingModels, isLoading } = useQuery({
    queryKey: ["GetEmbeddingModels"],
    queryFn: GetEmbeddingModels,
  });
  return (
    <NodeWrapper data={props}>
      <CardContent>
        <div className="grid w-full items-center gap-5">
          <FileUpload />
          <Label htmlFor="model">Embedding Model</Label>
          <Select
            disabled={isLoading}
            defaultValue={selectedWorkflow.definition?.embeddingModel}
            value={selectedWorkflow.definition?.embeddingModel}
            onValueChange={(value) =>
              updateSelectedWorkflowDefinition({ embeddingModel: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a embedding model" />
            </SelectTrigger>
            <SelectContent>
              {embeddingModels?.map((model: string) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </NodeWrapper>
  );
};

export default KnowledgeBaseNode;
