import { nodes } from "@/common/nodes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { Settings, X } from "lucide-react";
import CustomHandle from "../Handel";

const NodeWrapper = ({
  children,
  data,
}: {
  children: React.ReactNode;
  data: NodeProps;
}) => {
  const { nodeName, nodeDescription }: any = data.data;
  const NodeIcon = nodes.find((node) => node.type === data.type)?.icon;
  const { setNodes } = useReactFlow();

  const handleRemove = () => {
    setNodes((nds) => nds.filter((n) => n.id !== data.id));
  };
  return (
    <Card className="border h-full overflow-visible">
      <CardHeader className="justify-start text-start w-full border-b !pb-2 ">
        <CardTitle className="flex gap-4 items-center w-full text-sm">
          <NodeIcon className="size-5" /> <p> {nodeName}</p>
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
        {nodes
          .find((n) => n.type === data.type)
          ?.handles?.map((h, i) => (
            <CustomHandle
              key={i}
              type={h.type}
              position={h.position}
            />
          ))}
      </CardFooter>
    </Card>
  );
};

export default NodeWrapper;
