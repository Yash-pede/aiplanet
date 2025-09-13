import React, { use } from "react";

const ChatWithWorkflow = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);

  return <div>id:{id}</div>;
};

export default ChatWithWorkflow;
