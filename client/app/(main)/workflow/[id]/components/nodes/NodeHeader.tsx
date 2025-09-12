import React from "react";

const NodeHeader = ({
  data,
}: {
  data: { nodeName: string; nodeDescription: string };
}) => {
  return (
    <div className="p-4">
      {data.nodeName}
      {data.nodeDescription}
    </div>
  );
};

export default NodeHeader;
