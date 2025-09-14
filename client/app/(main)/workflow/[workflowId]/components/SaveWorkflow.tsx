import { Workflow } from "@/common/types";
import { Button } from "@/components/ui/button";
import { UpdateWorkflow } from "@/lib/mutateFunctions";
import { GetWorkflowById } from "@/lib/queryFunctions";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

const SaveWorkflow = () => {
  const selectWorkflow = useWorkflowStore((s) => s.selectWorkflow);
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const { data: workflow, refetch } = useQuery<Workflow, Error>({
    queryKey: ["workflow", selectedWorkflow?.id],
    queryFn: () => GetWorkflowById(selectedWorkflow?.id),
    refetchOnMount: true,
    enabled: !!selectedWorkflow?.id,
  });
  const { mutate: updateWorkflow, isPending } = useMutation({
    mutationFn: UpdateWorkflow,
    onSuccess() {
      refetch();
    },
  });
  useEffect(() => {
    if (workflow) selectWorkflow(workflow );
  }, [selectWorkflow, workflow, selectedWorkflow?.id]);

  return (
    <Button
      disabled={isPending}
      onClick={() => updateWorkflow(selectedWorkflow)}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
    </Button>
  );
};

export default SaveWorkflow;
