import { MessageSquareMore } from "lucide-react";
import React from "react";

const NewChat = () => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 justify-center items-center">
      <MessageSquareMore size={40} className="text-muted-foreground" />
      <h3 className="text-center text-2xl text-muted-foreground">
        Ai Planet
      </h3>
    </div>
  );
};

export default NewChat;
