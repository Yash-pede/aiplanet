import React, { useEffect } from "react";
import NodeWrapper from "./NodeWrapper";
import { NodeProps } from "@xyflow/react";

const InputNode = (props: NodeProps) => {
  return <NodeWrapper data={props}>{props.id}</NodeWrapper>;
};

export default InputNode;
