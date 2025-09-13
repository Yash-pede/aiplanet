import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { NodeProps } from "@xyflow/react";
import React from "react";
import NodeWrapper from "./NodeWrapper";
import { CardContent } from "@/components/ui/card";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PROMPT } from "@/common/nodes";
import { Input } from "@/components/ui/input";

const LLMNode = (props: NodeProps) => {
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const updateSelectedWorkflowDefinition = useWorkflowStore(
    (s) => s.updateSelectedWorkflowDefinition
  );

  return (
    <NodeWrapper data={props}>
      <CardContent>
        <div className="grid w-full items-center gap-5">
          <Label htmlFor="llm">LLM Model</Label>
          <Select
            defaultValue={selectedWorkflow.definition?.llmModel}
            value={selectedWorkflow.definition?.llmModel}
            onValueChange={(value) =>
              updateSelectedWorkflowDefinition({ llmModel: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a LLM Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="o4">o4</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="sys-prompt">System Prompt</Label>
          <Textarea
            id="sys-prompt"
            value={
              selectedWorkflow.definition?.prompt !== ""
                ? selectedWorkflow.definition?.prompt
                : undefined
            }
            defaultValue={DEFAULT_PROMPT}
            onChange={(e) => {
              updateSelectedWorkflowDefinition({
                prompt: e.target.value,
              });
            }}
            // defaultValue={DEFAULT_PROMPT}
            placeholder="Write your query here."
            className="resize-none max-h-32 min-h-32"
          />
          <Label htmlFor="temprature">Temprature</Label>
          <Input
            type="number"
            max={1}
            min={0}
            step={0.1}
            defaultValue={0.5}
            value={selectedWorkflow.definition?.temperature ?? 0.5}
            onChange={(e) =>
              updateSelectedWorkflowDefinition({
                temperature: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </CardContent>
    </NodeWrapper>
  );
};

export default LLMNode;
