"use client";

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  Copy,
  Globe,
  MoreHorizontal,
  Pencil,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Loader2,
} from "lucide-react";
import { use, useEffect, useState, useCallback, useRef } from "react";
import { cn, isUuid } from "@/utils/utils";
import NewChat from "./components/NewChat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { GetAllMessagesBySessionId } from "@/lib/queryFunctions";
import { SendFirstMessage, SendMessage } from "@/lib/mutateFunctions";
import { useRouter } from "next/navigation";

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  message: string | null;
  metadata?: any;
  created_at: string;
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ workflowId: string; slug?: string[] }>;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const { workflowId, slug } = use(params);
  const router = useRouter();
  const realtimeChannelRef = useRef<any>(null);

  const sessionId = slug?.[0];
  const isValidSession = !!(sessionId && isUuid(sessionId));

  const {
    data: chatMessages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<ChatMessage[]>({
    queryKey: ["chat_messages", sessionId],
    queryFn: async () => GetAllMessagesBySessionId(sessionId),
    enabled: isValidSession,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const addMessageToCache = useCallback(
    (message: ChatMessage) => {
      queryClient.setQueryData<ChatMessage[]>(
        ["chat_messages", sessionId],
        (oldData = []) => {
          const exists = oldData.some((msg) => msg.id === message.id);
          if (exists) {
            return oldData.map((msg) =>
              msg.id === message.id ? message : msg
            );
          }
          return [...oldData, message];
        }
      );
    },
    [queryClient, sessionId]
  );

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const optimisticUserMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        session_id: sessionId!,
        role: "user",
        message: message,
        created_at: new Date().toISOString(),
      };

      addMessageToCache(optimisticUserMessage);

      const optimisticAssistantMessage: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        session_id: sessionId!,
        role: "assistant",
        message: null,
        metadata: { status: "generating" },
        created_at: new Date().toISOString(),
      };

      addMessageToCache(optimisticAssistantMessage);

      return SendMessage(sessionId, message);
    },
    onSuccess: (data) => {
      setPrompt("");
      queryClient.setQueryData<ChatMessage[]>(
        ["chat_messages", sessionId],
        (oldData = []) => oldData.filter((msg) => !msg.id.startsWith("temp-"))
      );
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      queryClient.setQueryData<ChatMessage[]>(
        ["chat_messages", sessionId],
        (oldData = []) => oldData.filter((msg) => !msg.id.startsWith("temp-"))
      );
    },
  });

  const { mutate: sendFirstMessage, isPending: isLoadingNewMessage } =
    useMutation({
      mutationFn: async (message: string) =>
        SendFirstMessage(message, {
          is_first: true,
          workflow_id: workflowId,
        }),
      onSuccess: (data) => {
        setPrompt("");
        router.push(`/workflow/${workflowId}/chat/${data.session_id}`);
      },
      onError: (error) => {
        console.error("Failed to send first message:", error);
      },
    });

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || sendMessageMutation.isPending || isLoadingNewMessage)
      return;

    if (!isValidSession) {
      return sendFirstMessage(prompt.trim());
    } else {
      sendMessageMutation.mutate(prompt.trim());
    }
  }, [
    prompt,
    sendMessageMutation,
    isValidSession,
    sendFirstMessage,
    isLoadingNewMessage,
  ]);

  useEffect(() => {
    if (!isValidSession) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`chat_messages_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Realtime event:", payload);

          queryClient.setQueryData<ChatMessage[]>(
            ["chat_messages", sessionId],
            (oldData = []) => {
              const newMessage = payload.new as ChatMessage;

              if (!newMessage) return oldData;

              if (payload.eventType === "INSERT") {
                const exists = oldData.some((msg) => msg.id === newMessage.id);
                if (exists) return oldData;

                const updatedData = [...oldData, newMessage];
                return updatedData.sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
              }

              if (payload.eventType === "UPDATE") {
                return oldData.map((msg) =>
                  msg.id === newMessage.id ? newMessage : msg
                );
              }

              if (payload.eventType === "DELETE") {
                const deletedMessage = payload.old as ChatMessage;
                return oldData.filter((msg) => msg.id !== deletedMessage.id);
              }

              return oldData;
            }
          );
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [sessionId, isValidSession, supabase, queryClient]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  if (isLoadingMessages) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Failed to load messages</p>
            <Button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["chat_messages", sessionId],
                })
              }
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden"
      suppressHydrationWarning
    >
      <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto px-4 py-12">
        <ChatContainerContent className="space-y-12 px-4 py-12">
          {isValidSession ? (
            chatMessages.length > 0 ? (
              <>
                {chatMessages.map((message, index) => {
                  const isAssistant =
                    message.role === "assistant" || message.role === "system";
                  const isLastMessage = index === chatMessages.length - 1;
                  const isGenerating =
                    message?.metadata?.status === "generating";

                  return (
                    <Message
                      key={message.id}
                      className={cn(
                        "mx-auto flex w-full max-w-3xl flex-col gap-2 px-0 md:px-6",
                        isAssistant ? "items-start" : "items-end"
                      )}
                    >
                      {isAssistant ? (
                        <div className="group flex w-full flex-col gap-0">
                          {isGenerating ? (
                            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                Thinking...
                              </span>
                            </div>
                          ) : (
                            <MessageContent
                              markdown
                              className="text-foreground prose w-full flex-1 rounded-lg bg-transparent p-0"
                            >
                              {message.message ?? ""}
                            </MessageContent>
                          )}

                          {!isGenerating && (
                            <MessageActions
                              className={cn(
                                "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                                isLastMessage && "opacity-100"
                              )}
                            >
                              <MessageAction tooltip="Copy" delayDuration={100}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full"
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      message.message ?? ""
                                    )
                                  }
                                >
                                  <Copy />
                                </Button>
                              </MessageAction>
                              <MessageAction
                                tooltip="Upvote"
                                delayDuration={100}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full"
                                >
                                  <ThumbsUp />
                                </Button>
                              </MessageAction>
                              <MessageAction
                                tooltip="Downvote"
                                delayDuration={100}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full"
                                >
                                  <ThumbsDown />
                                </Button>
                              </MessageAction>
                            </MessageActions>
                          )}
                        </div>
                      ) : (
                        <div className="group flex flex-col items-end gap-1">
                          <MessageContent
                            className="bg-muted max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]"
                            markdown
                          >
                            {message.message ?? ""}
                          </MessageContent>
                          <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <MessageAction tooltip="Edit" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <Pencil />
                              </Button>
                            </MessageAction>
                            <MessageAction tooltip="Delete" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <Trash />
                              </Button>
                            </MessageAction>
                            <MessageAction tooltip="Copy" delayDuration={100}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    message.message ?? ""
                                  )
                                }
                              >
                                <Copy />
                              </Button>
                            </MessageAction>
                          </MessageActions>
                        </div>
                      )}
                    </Message>
                  );
                })}
                {/* <div ref={messagesEndRef} /> */}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            )
          ) : (
            <NewChat />
          )}
        </ChatContainerContent>
      </ChatContainerRoot>

      {/* Input */}
      <div className="inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <PromptInput
          isLoading={sendMessageMutation.isPending || isLoadingNewMessage}
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={handleSubmit}
          className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
        >
          <div className="flex flex-col">
            <PromptInputTextarea
              placeholder="Ask anything"
              className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3]"
              disabled={sendMessageMutation.isPending || isLoadingNewMessage}
            />

            <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
              <div className="flex items-center gap-2">
                <PromptInputAction tooltip="Add a new action">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                  >
                    <Plus size={18} />
                  </Button>
                </PromptInputAction>

                <PromptInputAction tooltip="Search">
                  <Button variant="outline" className="rounded-full">
                    <Globe size={18} />
                    Search
                  </Button>
                </PromptInputAction>

                <PromptInputAction tooltip="More actions">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                  >
                    <MoreHorizontal size={18} />
                  </Button>
                </PromptInputAction>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  disabled={
                    !prompt.trim() ||
                    sendMessageMutation.isPending ||
                    isLoadingNewMessage
                  }
                  onClick={handleSubmit}
                  className="size-9 rounded-full"
                >
                  {sendMessageMutation.isPending || isLoadingNewMessage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowUp size={18} />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}
