"use client";
import { useCallback } from "react";
import {
  Background,
  Connection,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SnapGrid,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { CanvasSidebar } from "./Sidebar";
import { useTheme } from "next-themes";
import { Database } from "@/database.types";
import EmptyCanvas from "./EmptyCanvas";
import InputNode from "./nodes/InputNode";
import LLMNode from "./nodes/LLMNode";
import KnowledgeBaseNode from "./nodes/KnowledgeBaseNode";
import OutputNode from "./nodes/OutputNode";

export default function Canvas({
  workflow,
}: {
  workflow: Database["public"]["Tables"]["workflows"]["Row"];
}) {
  const { theme } = useTheme();
  const [nodes, _, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const nodeTypes = {
    input: InputNode,
    llm: LLMNode,
    "knowledge-base": KnowledgeBaseNode,
    output: OutputNode,
  };

  const snapGrid: SnapGrid = [20, 20];

  return (
    <ReactFlowProvider>
      <div className="flex grow  h-full w-full">
        <CanvasSidebar workflow={workflow} />
        <div className="grow h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            colorMode={theme === "dark" ? "dark" : "light"}
            minZoom={0.8}
            maxZoom={1}
            snapToGrid={true}
            snapGrid={snapGrid}
          >
            {nodes.length === 0 && edges.length === 0 && <EmptyCanvas />}
            <Controls />{" "}
            <MiniMap
            // nodeStrokeColor={(n) => {
            //   if (n.type === "input") return "#0041d0";
            //   if (n.type === "selectorNode") return computedStyles.getPropertyValue("--background");
            //   if (n.type === "output") return "#ff0072";
            // }}
            // nodeColor={(n) => {
            //   if (n.type === "selectorNode") return bgColor;
            //   return "#fff";
            // }}
            />
            <Background bgColor={"var(--background)"} />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
