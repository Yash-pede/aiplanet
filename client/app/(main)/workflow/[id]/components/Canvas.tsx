"use client";
import { useCallback } from "react";
import {
  Background,
  Connection,
  Controls,
  ReactFlow,
  ReactFlowProvider,
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
            // minZoom={1}
            maxZoom={1}
          >
            {nodes.length === 0 && edges.length === 0 && <EmptyCanvas />}
            <Controls />
            <Background bgColor={"var(--background)"} />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
