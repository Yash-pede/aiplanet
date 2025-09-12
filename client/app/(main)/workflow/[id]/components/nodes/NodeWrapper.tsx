import {
  Card,
  CardAction,
  CardContent,
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
  return (
    <Card className="border h-full overflow-visible">
      <CardHeader className="justify-start text-start w-full">
        <CardTitle className="flex justify-between items-center w-full">
          <p> {nodeName}</p>
        </CardTitle>
        <CardAction>
          <Settings />
        </CardAction>
        <CardDescription>{nodeDescription}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
};

export default NodeWrapper;
