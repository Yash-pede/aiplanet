import { nodes } from "@/common/nodes";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NodeProps } from "@xyflow/react";
import { Settings } from "lucide-react";

const NodeWrapper = ({
  children,
  data,
}: {
  children: React.ReactNode;
  data: NodeProps;
}) => {
  const { nodeName, nodeDescription }: any = data.data;
  const NodeIcon = nodes.find((node) => node.type === data.type)?.icon;

  return (
    <Card className="border h-full overflow-visible">
      <CardHeader className="justify-start text-start w-full border-b !pb-2 ">
        <CardTitle className="flex gap-4 items-center w-full text-sm">
          <NodeIcon className="size-5" /> <p> {nodeName}</p>
        </CardTitle>
        <CardAction>
          <Settings />
        </CardAction>
        <CardDescription>{nodeDescription}</CardDescription>
      </CardHeader>
      {children}
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
};

export default NodeWrapper;
