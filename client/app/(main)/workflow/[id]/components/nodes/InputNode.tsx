"use client";

import React, { useEffect, useState } from "react";
import NodeWrapper from "./NodeWrapper";
import { NodeProps } from "@xyflow/react";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { useDebouncedCallback } from "use-debounce";

const InputNode = (props: NodeProps) => {
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const updateSelectedWorkflow = useWorkflowStore(
    (s) => s.updateSelectedWorkflow
  );

  const [value, setValue] = useState(selectedWorkflow?.name ?? "");

  useEffect(() => {
    setValue(selectedWorkflow?.name ?? "");
  }, [selectedWorkflow?.name]);

  const debouncedUpdate = useDebouncedCallback((name: string) => {
    updateSelectedWorkflow({ name });
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedUpdate(newValue);
  };

  return (
    <NodeWrapper data={props}>
      <CardContent>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="query">User Query</Label>
          <Textarea
            id="query"
            value={value}
            onChange={handleChange}
            placeholder="Write your query here."
            className="resize-none"
          />
        </div>
      </CardContent>
    </NodeWrapper>
  );
};

export default InputNode;
