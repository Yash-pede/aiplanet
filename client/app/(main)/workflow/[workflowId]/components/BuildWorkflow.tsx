"use client";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import React, { useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import _ from "lodash";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetWorkflowById, GetWorkflowDocument } from "@/lib/queryFunctions";
import { Workflow } from "@/common/types";
import { ExecuteWorkflow } from "@/lib/mutateFunctions";
import { Database } from "@/database.types";
import { useRouter } from "next/navigation";

const BuildWorkflow = () => {
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const router = useRouter();
  const {
    data: workflow,
    isLoading,
    error,
    refetch,
  } = useQuery<Workflow, Error>({
    queryKey: ["workflow", selectedWorkflow?.id],
    queryFn: () => GetWorkflowById(selectedWorkflow?.id),
    refetchOnMount: true,
    enabled: !!selectedWorkflow?.id,
  });

  const { data: workflowExecution, mutate: executeWorkflow } = useMutation({
    mutationFn: ExecuteWorkflow,
    onSuccess() {
      toast.success(workflowExecution.message);
    },
  });

  const { data: Document, isLoading: isLoadingDocument } = useQuery<
    Database["public"]["Tables"]["documents"]["Row"][]
  >({
    queryKey: ["documents", selectedWorkflow?.id],
    enabled: !!selectedWorkflow,
    queryFn: () => GetWorkflowDocument(selectedWorkflow?.id as string),
  });

  const validateWorkflow = () => {
    if (!workflow || !selectedWorkflow) return;
    if (workflow.status === "completed" || workflow.status === "in_progress")
      return toast.error(`Workflow is already ${workflow.status}`, {
        description: `you cannot build a workflow that is ${workflow.status}`,
      });
    const nodes = selectedWorkflow.definition?.flow?.nodes || [];
    const edges = selectedWorkflow.definition?.flow?.edges || [];

    const inputNode = nodes.find((n) => n.type === "query");
    const knowledgeBaseNode = nodes.find((n) => n.type === "knowledge-base");
    const llmNode = nodes.find((n) => n.type === "llm");
    const outputNode = nodes.find((n) => n.type === "output");
    // console.log(inputNode , knowledgeBaseNode , llmNode , outputNode,nodes,selectedWorkflow);
    if (!inputNode || !knowledgeBaseNode || !llmNode || !outputNode) {
      toast.error("Missing nodes", {
        description:
          "Your workflow must include Input, Knowledge Base, LLM, and Output nodes.",
      });
      return false;
    }

    const hasInputToKB = edges.some(
      (e) => e.source === inputNode.id && e.target === knowledgeBaseNode.id
    );
    const hasKBToLLM = edges.some(
      (e) => e.source === knowledgeBaseNode.id && e.target === llmNode.id
    );
    const hasLLMToOutput = edges.some(
      (e) => e.source === llmNode.id && e.target === outputNode.id
    );
    if (!hasInputToKB || !hasKBToLLM || !hasLLMToOutput) {
      toast.error("Invalid connections", {
        description:
          "Make sure Input → Knowledge Base → LLM → Output are properly connected.",
      });
      return false;
    }
    if (Document?.length === 0) {
      toast.error("No document uploaded", {
        description: "Please upload a document in the Knowledge Base node.",
      });
      return false;
    }
    if (
      !selectedWorkflow.definition?.query ||
      !selectedWorkflow.definition?.prompt
    ) {
      toast.error("Missing fields", {
        description: "Input query and LLM prompt must not be empty.",
      });

      return false;
    }
    if (!selectedWorkflow.definition.embeddingModel) {
      toast.error("Missing fields", {
        description: "Embedding model must be selected in Knowledge Base node.",
      });
      return false;
    }
    if (!selectedWorkflow.definition.llmModel) {
      toast.error("Missing fields", {
        description: "LLM model must be selected in LLM node.",
      });
      return false;
    }
    const isSaved =
      _.isEqual(selectedWorkflow.definition, workflow.definition) &&
      selectedWorkflow.name === workflow.name &&
      selectedWorkflow.description === workflow.description;

    if (!isSaved) {
      toast.error("Workflow not saved", {
        description: "Please save the workflow before building.",
      });
      return false;
    }
    refetch();
    if (workflow.status === "pending" || workflow.status === "failed") {
      executeWorkflow(selectedWorkflow.id);
      toast.success("Workflow build started");
    }
    return true;
  };
  useEffect(() => {
    if (workflow) {
      // router.push(`/workflow/${workflow.id}/chat`);
    }
  }, [workflow]);
  if (isLoading || !workflow) return null;
  if (error) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          className="rounded-full w-12 h-12 p-0"
          onClick={validateWorkflow}
          disabled={workflow.status === "completed"}
        >
          <Play className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {workflow.status === "in_progress"
          ? "Workflow build in progress"
          : workflow.status === "completed"
          ? "Workflow build completed"
          : "Build Workflow"}
      </TooltipContent>
    </Tooltip>
  );
};

export default BuildWorkflow;
