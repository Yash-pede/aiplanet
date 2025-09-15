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
  const { workflowId, slug } = use(params);
  const router = useRouter();

  const sessionId = slug?.[0];
  const isValidSession = !!(sessionId && isUuid(sessionId));

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchMessages = async () => {
      if (!isValidSession) {
        if (mounted) setIsLoadingMessages(false);
        return;
      }
      try {
        if (mounted) setIsLoadingMessages(true);
        const data = await GetAllMessagesBySessionId(sessionId);
        if (mounted) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        if (mounted) setIsLoadingMessages(false);
      }
    };
    fetchMessages();
    return () => {
      mounted = false;
    };
  }, [sessionId, isValidSession]);

  const mergeIncoming = useCallback((incoming: ChatMessage | ChatMessage[]) => {
    const incomingArr = Array.isArray(incoming) ? incoming : [incoming];

    setMessages((prev) => {
      const map = new Map<string, ChatMessage>();
      for (const m of prev) map.set(m.id, m);

      for (const m of incomingArr) {
        map.set(m.id, m);
      }

      const merged = Array.from(map.values()).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return merged;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!prompt.trim() || isSending) return;

      setIsSending(true);

      if (!isValidSession) {
        try {
          const data = await SendFirstMessage(prompt.trim(), {
            is_first: true,
            workflow_id: workflowId,
          });

          setPrompt("");
          router.push(`/workflow/${workflowId}/chat/${data.session_id}`);
        } catch (err) {
          console.error("Failed to send first message", err);
        } finally {
          setIsSending(false);
        }
        return;
      }

      const tempUser: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        session_id: sessionId!,
        role: "user",
        message: prompt.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUser]);

      try {
        const resp = await SendMessage(sessionId!, prompt.trim());
        mergeIncoming(resp as ChatMessage | ChatMessage[]);
        setPrompt("");
      } catch (err) {
        console.error("Failed to send message", err);
        setMessages((prev) =>
          prev.filter((m) => !m.id.startsWith("temp-user-"))
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      prompt,
      isSending,
      isValidSession,
      sessionId,
      workflowId,
      router,
      mergeIncoming,
    ]
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
    }
  }, [messages]);

  if (isLoadingMessages) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            messages.length > 0 ? (
              <>
                {messages.map((message, index) => {
                  const isAssistant =
                    message.role === "assistant" || message.role === "system";
                  const isLastMessage = index === messages.length - 1;
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
                <div ref={messagesEndRef} />
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
        <form onSubmit={handleSubmit}>
          <PromptInput
            isLoading={isSending}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                placeholder="Ask anything"
                className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3]"
                disabled={isSending}
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
                    type="submit"
                    size="icon"
                    disabled={!prompt.trim() || isSending}
                    className="size-9 rounded-full"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </Button>
                </div>
              </PromptInputActions>
            </div>
          </PromptInput>
        </form>
      </div>
    </div>
  );
}
