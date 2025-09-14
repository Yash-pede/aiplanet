"use client";

import { GetWorkflowById } from "@/lib/queryFunctions";
import { useQuery } from "@tanstack/react-query";
import React, { use, useEffect } from "react";
import Canvas from "./components/Canvas";
import "@xyflow/react/dist/style.css";
import "@/css/xy-themes.css";
import ErrorCard from "@/components/layput/error/ErrorCard";
import Loading from "./components/loading";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { Workflow } from "@/common/types";

const WorkflowIdPage = ({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) => {
  const { workflowId: id } = use(params);

  const {
    data: workflow,
    isLoading,
    error,
  } = useQuery<Workflow, Error>({
    queryKey: ["workflow", id],
    queryFn: () => GetWorkflowById(id),
    refetchOnMount: true,
  });

  const selectWorkflow = useWorkflowStore((s) => s.selectWorkflow);
  useEffect(() => {
    selectWorkflow(workflow ?? null);
  }, [selectWorkflow, workflow, id]);

  if (error) return <ErrorCard onRetry={() => window.location.reload()} />;
  if (isLoading || !workflow) return <Loading />;

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <Canvas />
    </div>
  );
};

export default WorkflowIdPage;
