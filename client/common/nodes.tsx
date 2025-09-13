import { BookOpen, FileInput, FileOutput, Stars } from "lucide-react";
import { CustomNode } from "./types";
import InputNode from "@/app/(main)/workflow/[id]/components/nodes/InputNode";
import LLMNode from "@/app/(main)/workflow/[id]/components/nodes/LLMNode";
import KnowledgeBaseNode from "@/app/(main)/workflow/[id]/components/nodes/KnowledgeBaseNode";
import OutputNode from "@/app/(main)/workflow/[id]/components/nodes/OutputNode";

export const nodes: CustomNode[] = [
  {
    title: "user Query",
    type: "input",
    icon: FileInput,
    description: "Entry Point for query",
    width: 400,
    height: 300,
  },
  {
    title: "Knowledge Base",
    type: "knowledge-base",
    icon: BookOpen,
    description: "Run a Query with LLM",
    width: 500,
    height: 400,
  },
  {
    title: "LLM",
    type: "llm",
    icon: Stars,
    description: "Let LLM search info in your file",
    width: 500,
    height: 600,
  },
  {
    title: "Output",
    type: "output",
    icon: FileOutput,
    description: "Output of result nodes as text",
    width: 500,
    height: 300,
  },
];

export const DEFAULT_PROMPT ="You are a helpful PDF assistant. Use web search if the PDF lacks context"


 export const nodeTypes = {
    input: InputNode,
    llm: LLMNode,
    "knowledge-base": KnowledgeBaseNode,
    output: OutputNode,
  };