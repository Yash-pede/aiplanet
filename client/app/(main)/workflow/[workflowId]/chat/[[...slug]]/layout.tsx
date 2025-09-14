import React from "react";
import { SidebarWithChatHistory } from "./components/SidebarChatHistory";

const ChatLoayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarWithChatHistory />
      {children}
    </div>
  );
};

export default ChatLoayout;
