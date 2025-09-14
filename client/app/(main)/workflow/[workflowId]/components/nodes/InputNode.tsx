"use client";

import React from "react";
import NodeWrapper from "./NodeWrapper";
import { NodeProps } from "@xyflow/react";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflowStore } from "@/providers/workflow-store-provider";

const InputNode = (props: NodeProps) => {
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const updateSelectedWorkflowDefinition = useWorkflowStore(
    (s) => s.updateSelectedWorkflowDefinition
  );
  return (
    <NodeWrapper data={props}>
      <CardContent>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="query">User Query</Label>
          <Textarea
            id="query"
            value={selectedWorkflow?.definition?.query ?? ""}
            onChange={(e) => {
              updateSelectedWorkflowDefinition({ query: e.target.value });
            }}
            placeholder="Write your query here."
            className="resize-none"
          />
        </div>
      </CardContent>
    </NodeWrapper>
  );
};

export default InputNode;
