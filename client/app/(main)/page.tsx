"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NewWrokflow from "@/components/NewWrokflow";
import { useQuery } from "@tanstack/react-query";
import { GetWorkflows } from "@/lib/queryFunctions";
import ErrorCard from "@/components/layput/error/ErrorCard";
import { SkeletonCard } from "@/components/layput/skeleton/CardSkeleton";
import Link from "next/link";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { useEffect } from "react";
import { Workflow } from "@/common/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Badge } from "@/components/ui/badge";
dayjs.extend(relativeTime);
const Page = () => {
  const workflows = useWorkflowStore((s) => s.workflows);
  const setWorkflows = useWorkflowStore((s) => s.setWorkflows);
  const selectWorkflow = useWorkflowStore((s) => s.selectWorkflow);

  const { data, error, isLoading, isSuccess } = useQuery<
    Workflow[] | undefined,
    Error
  >({
    queryKey: ["workflows"],
    queryFn: GetWorkflows,
  });

  useEffect(() => {
    selectWorkflow(null);
  }, [selectWorkflow]);

  useEffect(() => {
    if (isSuccess) {
      setWorkflows(data);
    }
  }, [data, isSuccess, setWorkflows]);

  if (error) {
    return (
      <ErrorCard
        title="Failed to load workflows"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex flex-col w-full gap-5 p-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center w-full">
        <p>My workflows</p>
        <NewWrokflow />
      </div>

      {isLoading && (
        <div className="flex gap-5 md:flex-row flex-wrap w-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className=" w-full md:w-96" />
          ))}
        </div>
      )}

      {!isLoading && workflows.length > 0 && (
        <div className="flex flex-col md:flex-row flex-wrap gap-5">
          {workflows.map((workflow) => (
            <Link href={`/workflow/${workflow.id}`} key={workflow.id}>
              <Card className="md:w-96 w-full">
                <CardHeader>
                  <CardTitle>{workflow.name}</CardTitle>
                  <CardDescription>{workflow.description}</CardDescription>
                  <CardAction>
                    <Badge
                      variant={
                        workflow.status === "pending"
                          ? "outline"
                          : workflow.status === "completed"
                          ? "default"
                          : workflow.status === "in_progress"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {workflow.status}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p>{dayjs(workflow.updated_at).fromNow()}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && workflows.length === 0 && (
        <div className="grid place-items-center w-full mt-32">
          <Card className="md:w-96 w-full">
            <CardHeader>
              <CardTitle>No workflows found</CardTitle>
              <CardDescription>
                Start building your generative AI apps with our essential tools
                and frameworks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewWrokflow />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Page;
