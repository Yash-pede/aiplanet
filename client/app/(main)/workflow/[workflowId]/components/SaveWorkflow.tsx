import { Workflow } from "@/common/types";
import { Button } from "@/components/ui/button";
import { UpdateWorkflow } from "@/lib/mutateFunctions";
import { GetWorkflowById } from "@/lib/queryFunctions";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { sanitizeFlow } from "@/utils/sanitizeFlow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

const SaveWorkflow = () => {
  const selectWorkflow = useWorkflowStore((s) => s.selectWorkflow);
  const queryclient = useQueryClient();
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const { data: workflow, refetch } = useQuery<Workflow, Error>({
    queryKey: ["workflow", selectedWorkflow?.id],
    queryFn: () => GetWorkflowById(selectedWorkflow?.id),
    enabled: !!selectedWorkflow?.id,
  });
  const { mutate: updateWorkflow, isPending } = useMutation({
    mutationFn: UpdateWorkflow,

    onSuccess() {
      queryclient.invalidateQueries({ queryKey: ["workflows"] });
      queryclient.invalidateQueries({
        queryKey: ["workflow", selectedWorkflow?.id],
      });
      refetch();
    },
  });
  useEffect(() => {
    if (workflow) selectWorkflow(workflow);
  }, [selectWorkflow, workflow, selectedWorkflow?.id]);

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        if (!selectedWorkflow) return;

        const flow = selectedWorkflow.definition?.flow ?? {
          nodes: [],
          edges: [],
        };
        const { nodes: safeNodes, edges: safeEdges } = sanitizeFlow(
          flow.nodes as any,
          flow.edges as any
        );

        const payload = {
          ...selectedWorkflow,
          definition: {
            ...selectedWorkflow.definition,
            flow: { nodes: safeNodes, edges: safeEdges },
          },
        };

        updateWorkflow(payload);
      }}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
    </Button>
  );
};

export default SaveWorkflow;
