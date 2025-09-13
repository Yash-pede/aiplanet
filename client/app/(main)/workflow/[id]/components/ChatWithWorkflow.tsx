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
import { useMutation } from "@tanstack/react-query";
import { CreateSession } from "@/lib/mutateFunctions";

const ChatWithWorkflow = () => {
  const router = useRouter();
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);

  const { mutate: CreateSessionMutation, isPending } = useMutation({
    mutationFn: CreateSession,
    onSuccess: (data) => {
      router.push(
        `/workflow/${selectedWorkflow?.id}/chat?sessionId=${data.id}`
      );
    },
    onError: (error) => {
      console.error("Error creating session:", error);
    },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => CreateSessionMutation(selectedWorkflow?.id)}
          variant="default"
          className="rounded-full w-12 h-12 p-0 bg-blue-600 hover:bg-blue-700"
        >
          {isPending && <MessageCircleMore className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Chat with Workflow</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ChatWithWorkflow;
