import React, { useMemo } from "react";
import { nodes } from "@/common/nodes";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { Settings, X } from "lucide-react";
import CustomHandle from "../Handel";
import { useWorkflowStore } from "@/providers/workflow-store-provider";

const NodeWrapper = ({ children, data }: { children: React.ReactNode; data: NodeProps }) => {
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const { setNodes } = useReactFlow();

  const defaultNode = nodes.find((node) => node.type === data.type);


  const { width, height } = useMemo(() => {
    const savedNode = selectedWorkflow?.definition?.flow?.nodes.find((n) => n.id === data.id);
    return {
      width: savedNode?.measured?.width ?? defaultNode?.width ?? 400,
      height: savedNode?.measured?.height ?? defaultNode?.height ?? 300,
    };
  }, [data.id, defaultNode?.width, defaultNode?.height]);

  const { nodeName, nodeDescription }: any = data.data;
  const NodeIcon = defaultNode?.icon;

  const handleRemove = () => {
    setNodes((nds) => nds.filter((n) => n.id !== data.id));
  };

  return (
    <Card
      className="border overflow-visible hover:border-primary focus:border-primary"
      style={{
        width,
        height,
        minWidth: defaultNode?.width,
        minHeight: defaultNode?.height,
      }}
    >
      <CardHeader className="justify-start text-start w-full border-b !pb-2 ">
        <CardTitle className="flex gap-4 items-center w-full text-sm">
          {NodeIcon && <NodeIcon className="size-5" />} <p>{nodeName}</p>
        </CardTitle>
        <CardAction className="flex gap-2 items-center">
          <Settings />
          <Button size="icon" variant="destructiveGhost" onClick={handleRemove}>
            <X />
          </Button>
        </CardAction>
        <CardDescription>{nodeDescription}</CardDescription>
      </CardHeader>
      {children}
      <CardFooter>
        {defaultNode?.handles?.map((h, i) => (
          <CustomHandle key={i} type={h.type} position={h.position} />
        ))}
      </CardFooter>
    </Card>
  );
};

export default NodeWrapper;
