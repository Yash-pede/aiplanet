import { NodeProps } from "@xyflow/react";
import React from "react";
import NodeWrapper from "./NodeWrapper";
import { CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const OutputNode = (props: NodeProps) => {
  return (
    <NodeWrapper data={props}>
      <CardContent>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="output">Output Text</Label>
          <Textarea
            id="output"
            disabled
            // value={value}
            placeholder="Output will be generated based on query."
            className="resize-none"
          />
        </div>
      </CardContent>
    </NodeWrapper>
  );
};

export default OutputNode;
