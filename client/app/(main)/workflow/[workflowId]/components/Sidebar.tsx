"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/utils";
import { useDraggable } from "@neodrag/react";
import { Node, useReactFlow, XYPosition } from "@xyflow/react";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { nodes } from "@/common/nodes";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import SaveWorkflow from "./SaveWorkflow";
import { useQuery } from "@tanstack/react-query";
import { Workflow } from "@/common/types";
import { GetWorkflowById } from "@/lib/queryFunctions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";

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
  const {
    data: workflow,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<Workflow, Error>({
    queryKey: ["workflow", selectedWorkflow?.id],
    queryFn: () => GetWorkflowById(selectedWorkflow.id as string),
    refetchOnMount: true,
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
        <SaveWorkflow />
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
      <SidebarFooter className="flex flex-row items-center gap-2 justify-around">
        <p> Status: </p>{" "}
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
        <Button size="icon" onClick={() => refetch()} disabled={isLoading}>
          {isLoading || isRefetching ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RotateCcw />
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
