"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDraggable } from "@neodrag/react";
import { Node, useReactFlow, XYPosition } from "@xyflow/react";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { nodes } from "@/common/nodes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateWorkflow } from "@/lib/mutateFunctions";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { Loader2 } from "lucide-react";

const getId = () => `node_${Date.now()}`;

interface DraggableNodeProps {
  className?: string;
  children: React.ReactNode;
  nodeType: string;
  onDrop: (
    nodeType: string,
    position: XYPosition,
    nodeName: string,
    nodeDescription: string,
    width: number,
    height: number
  ) => void;
  nodeName: string;
  nodeDescription: string;
  width: number;
  height: number;
}

function DraggableNode({
  className,
  children,
  nodeType,
  onDrop,
  nodeName,
  nodeDescription,
  height,
  width,
}: DraggableNodeProps) {
  const draggableRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<XYPosition>({ x: 0, y: 0 });

  useDraggable(draggableRef as RefObject<HTMLDivElement>, {
    position,
    onDrag: ({ offsetX, offsetY }) => {
      setPosition({ x: offsetX, y: offsetY });
    },
    onDragEnd: ({ event }) => {
      setPosition({ x: 0, y: 0 });
      onDrop(
        nodeType,
        {
          x: event.clientX,
          y: event.clientY,
        },
        nodeName,
        nodeDescription,
        width,
        height
      );
    },
  });

  return (
    <div className={cn("node cursor-move", className)} ref={draggableRef}>
      {children}
    </div>
  );
}

export function CanvasSidebar() {
  const { setNodes, screenToFlowPosition } = useReactFlow();
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const updateSelectedWorkflow = useWorkflowStore(
    (s) => s.updateSelectedWorkflow
  );
  const queryClient = useQueryClient();
  const { mutate: updateWorkflow, isPending } = useMutation({
    mutationFn: UpdateWorkflow,
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["workflow", selectedWorkflow.id],
      });
    },
  });

  const handleNodeDrop = useCallback(
    (
      nodeType: string,
      screenPosition: XYPosition,
      nodeName: string,
      nodeDescription: string,
      width: number,
      height: number
    ) => {
      const flow = document.querySelector(".react-flow");
      const flowRect = flow?.getBoundingClientRect();
      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom;

      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);

        const newNode: Node = {
          id: getId(),
          type: nodeType,
          position,
          data: { nodeName, nodeDescription },
          width: width,
          height: height,
        };

        setNodes((prev) => [...prev, newNode]);
      }
    },
    [setNodes, screenToFlowPosition]
  );
  return (
    <Sidebar variant="floating" className="relative h-[calc(100vh-4rem)]">
      <SidebarHeader>
        <Button disabled={isPending} onClick={() => updateWorkflow(selectedWorkflow)}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
        </Button>
        <Input
          type="text"
          placeholder="Workflow name"
          className="text-foreground"
          defaultValue={selectedWorkflow?.name ?? ""}
          onBlur={(e) => {
            if (selectedWorkflow?.name !== e.target.value) {
              updateSelectedWorkflow({ name: e.target.value });
            }
          }}
          disabled={isPending}
          onChange={(e) => {
            if (selectedWorkflow?.name !== e.target.value) {
              updateSelectedWorkflow({ name: e.target.value });
            }
          }}
        />
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Nodes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nodes.map((item) => (
                <SidebarMenuItem key={item.type}>
                  <SidebarMenuButton asChild>
                    <DraggableNode
                      className="flex items-center gap-2 p-2 border rounded-md"
                      nodeType={item.type}
                      onDrop={handleNodeDrop}
                      nodeName={item.title}
                      nodeDescription={item.description}
                      height={item.height}
                      width={item.width}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </DraggableNode>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
