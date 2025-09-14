"use client";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircleMore, Play } from "lucide-react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreateSession } from "@/lib/mutateFunctions";
import { Workflow } from "@/common/types";
import { GetWorkflowById } from "@/lib/queryFunctions";
import { toast } from "sonner";

const ChatWithWorkflow = () => {
  const router = useRouter();
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);

  const { mutate: CreateSessionMutation, isPending } = useMutation({
    mutationFn: CreateSession,
    onSuccess: (data) => {
      router.push(`/workflow/${selectedWorkflow?.id}/chat`);
    },
    onError: (error) => {
      console.error("Error creating session:", error);
    },
  });

  const {
    data: workflow,
    isLoading,
    error,
    refetch,
  } = useQuery<Workflow, Error>({
    queryKey: ["workflow", selectedWorkflow?.id],
    queryFn: () => GetWorkflowById(selectedWorkflow?.id),
    enabled: !!selectedWorkflow?.id,
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => {
            refetch();
            if (workflow.status !== "completed") return toast.error("Please build the workflow before starting a chat session.");
            CreateSessionMutation(selectedWorkflow?.id);
          }}
          variant="default"
          className="rounded-full w-12 h-12 p-0 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircleMore className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Chat with Workflow</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ChatWithWorkflow;
