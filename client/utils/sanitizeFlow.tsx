import { Node, Edge } from "@xyflow/react";

export function sanitizeFlow(nodes: Node[], edges: Edge[]) {
  const safeNodes = (nodes || []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position ? { x: n.position.x, y: n.position.y } : undefined,
    data: n.data ?? {},
    measured: n.measured ? { width: n.measured.width, height: n.measured.height } : undefined,
    style: n.style ?? (n.measured ? { width: n.measured.width, height: n.measured.height } : undefined),
  })).filter((n) => !!n.id);

  const safeEdges = (edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: (e as any).sourceHandle,
    targetHandle: (e as any).targetHandle,
    type: e.type,
  })).filter((e) => e.id && e.source && e.target);

  return { nodes: safeNodes, edges: safeEdges };
}
