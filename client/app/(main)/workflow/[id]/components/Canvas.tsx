"use client";
import { useCallback, useEffect } from "react";
import {
  Background,
  Connection,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SnapGrid,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useDebouncedCallback } from "use-debounce";
import "@xyflow/react/dist/style.css";
import { CanvasSidebar } from "./Sidebar";
import { useTheme } from "next-themes";
import EmptyCanvas from "./EmptyCanvas";
import { nodeTypes } from "@/common/nodes";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import BuildWorkflow from "./BuildWorkflow";
import ChatWithWorkflow from "./ChatWithWorkflow";

export default function Canvas() {
  const { theme } = useTheme();
  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    selectedWorkflow?.definition?.flow?.nodes ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    selectedWorkflow?.definition?.flow?.edges ?? []
  );
  useEffect(() => {
    if (selectedWorkflow?.definition?.flow) {
      setNodes(selectedWorkflow.definition.flow.nodes || []);
      setEdges(selectedWorkflow.definition.flow.edges || []);
    }
  }, [selectedWorkflow?.id, setNodes, setEdges]);

  const saveFlow = useWorkflowStore((s) => s.saveFlow);
  const saveFlowDebounced = useDebouncedCallback((nodes, edges) => {
    saveFlow(nodes, edges);
  }, 500);
  const handleNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        saveFlowDebounced(newNodes, edges);
        return newNodes;
      });
    },
    [setNodes, edges, saveFlowDebounced]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        saveFlowDebounced(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, saveFlowDebounced]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        saveFlowDebounced(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, saveFlowDebounced]
  );

  const snapGrid: SnapGrid = [20, 20];
  return (
    <ReactFlowProvider>
      <div className="flex grow  h-full w-full">
        <CanvasSidebar />
        <div className="grow h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            colorMode={theme === "dark" ? "dark" : "light"}
            // minZoom={0.8}
            // maxZoom={1}
            snapToGrid={true}
            snapGrid={snapGrid}
          >
            {nodes.length === 0 && edges.length === 0 && <EmptyCanvas />}
            <Controls />
            <MiniMap
              style={{
                top: 0,
                height: 120,
                borderRadius: "var(--radius)",
              }}
            />
            <Background bgColor={"var(--background)"} />
            <div className="absolute bottom-4 right-0 -translate-x-1/2 flex flex-col gap-4 z-10">
              {/* <BuildWorkflow /> */}
              {/* <ChatWithWorkflow /> */}
            </div>
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
