"use client";

import ErrorCard from "@/components/layput/error/ErrorCard";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Database } from "@/database.types";
import { ListSessionsByWorkflowId } from "@/lib/queryFunctions";
import { isUuid } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusIcon, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function SidebarWithChatHistory() {
  const pathname = usePathname();
  const router = useRouter();
  const workflowId = pathname.split("/").at(2);
  const {
    data: sessionHistory,
    isLoading,
    isError,
  } = useQuery<Database["public"]["Tables"]["chat_sessions"]["Row"][]>({
    queryKey: ["chat_sessions"],
    queryFn: () => ListSessionsByWorkflowId(workflowId),
    enabled: !!workflowId,
  });
  if (isError) return <ErrorCard className="w-[var(--sidebar-width)]" />;
  return (
    <Sidebar variant="floating" className="relative h-[calc(100vh-4rem)] ">
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 py-4 ">
        <div className="flex flex-row items-center gap-2 px-2">
          <div className="bg-primary/10 size-8 rounded-md"></div>
          <div className="text-md font-base  tracking-tight">
            Ai.Planet
          </div>
        </div>
        <Button variant="ghost" className="size-8">
          <Search className="size-4" />
        </Button>
      </SidebarHeader>
      {isLoading ? (
        <SidebarContent className="pt-4 no-scrollbar">
          <Button className="w-[90%] mx-auto">
            <PlusIcon /> New Chat
          </Button>
          <Loader2 className="animate-spin size-8 my-auto mx-auto" />
        </SidebarContent>
      ) : (
        <SidebarContent className="pt-4 no-scrollbar">
          <Button className="w-[90%] mx-auto" onClick={() => router.push(`/workflow/${workflowId}/chat/`)}>
            <PlusIcon /> New Chat
          </Button>
          <SidebarGroup>
            <SidebarMenu>
              {sessionHistory.map((conversation) => (
                <SidebarMenuButton
                  key={conversation.id}
                  onClick={() =>
                    router.push(
                      `/workflow/${workflowId}/chat/${conversation.id}`
                    )
                  }
                >
                  <span>{conversation.title}</span>
                </SidebarMenuButton>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      )}
    </Sidebar>
  );
}
