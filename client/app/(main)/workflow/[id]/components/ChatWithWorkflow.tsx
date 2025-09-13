"use client";
import { Button } from "@/components/ui/button";
import { MessageCircleMore, Play } from "lucide-react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useWorkflowStore } from "@/providers/workflow-store-provider";

const ChatWithWorkflow = () => {
  const router = useRouter();
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => router.push(`/workflow/${selectedWorkflow?.id}`)}
          variant="default"
          className="rounded-full w-12 h-12 p-0 bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircleMore className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Chat with Workflow</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ChatWithWorkflow;
