"use client";
import { Database } from "@/database.types";
import { GetWorkflowById } from "@/lib/queryFunctions";
import { useQuery } from "@tanstack/react-query";
import React, { use, useEffect } from "react";
import Canvas from "./components/Canvas";
import "@xyflow/react/dist/style.css";
import "@/css/xy-themes.css";
import ErrorCard from "@/components/layput/error/ErrorCard";
import Loading from "./components/loading";
import { useWorkflowStore } from "@/providers/workflow-store-provider";

const WorkflowIdPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const selectWorkflow = useWorkflowStore((s) => s.selectWorkflow);

  const { data, isLoading, error, isSuccess } = useQuery<
    Database["public"]["Tables"]["workflows"]["Row"]
  >({
    queryKey: ["workflow", id],
    queryFn: async () => {
      const response = await GetWorkflowById(id);
      return response;
    },
  });
  useEffect(() => {
    if (isSuccess) {
      selectWorkflow(data);
    }
  }, [data, isSuccess]);

  if (!data || isLoading) return <Loading />;
  if (error) return <ErrorCard onRetry={() => window.location.reload()} />;
  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <Canvas workflow={data} />
    </div>
  );
};

export default WorkflowIdPage;
