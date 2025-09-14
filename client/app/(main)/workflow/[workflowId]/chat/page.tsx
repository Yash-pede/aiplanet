import React, { use } from "react";

const ChatWithWorkflow = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id: workflowId } = use(params);

  return <div>id:{workflowId}</div>;
};

export default ChatWithWorkflow;
