"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Loader2, Bot, User, MessageSquare, AlertCircle, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

type MessageAttachment = {
  id: string;
  type: "file";
  filename?: string;
  mediaType: string;
  url: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  attachments?: MessageAttachment[];
  failed?: boolean;
};

const STARTER_PROMPTS = [
  "Summarize my recent tasks",
  "Help me write a project brief",
  "Generate a weekly plan",
  "What can you help me with?",
];

const CHAT_API_ENDPOINT = "/api/chat";
const CHAT_MODEL = { provider: "google", model: "gemini-2.5-flash" } as const;

// Stable reference so ReactMarkdown doesn't re-create renderers on every message render.
const markdownComponents: Components = {
  p: ({ children }) => <p className="text-sm">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 text-sm">{children}</ol>,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-xs">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
      {children}
    </a>
  ),
};

interface AttachmentItemProps {
  attachment: MessageAttachment;
  onRemove: (id: string) => void;
}

const AttachmentItem = memo(({ attachment, onRemove }: AttachmentItemProps) => {
  const handleRemove = useCallback(() => onRemove(attachment.id), [onRemove, attachment.id]);
  return (
    <Attachment data={attachment} key={attachment.id} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
});
AttachmentItem.displayName = "AttachmentItem";

function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments]);

  if (attachments.files.length === 0) return null;

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem attachment={attachment} key={attachment.id} onRemove={handleRemove} />
      ))}
    </Attachments>
  );
}

function ChatPromptInput({
  isLoading,
  onSubmit,
}: {
  isLoading: boolean;
  onSubmit: (message: PromptInputMessage) => void;
}) {
  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit} className="rounded-2xl">
        <PromptInputAttachmentsDisplay />
        <PromptInputBody>
          <PromptInputTextarea placeholder="Ask anything..." />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
                <PromptInputActionAddScreenshot />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputTools>
            <PromptInputSubmit disabled={isLoading} />
          </PromptInputTools>
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
}

interface MessageBubbleProps {
  message: Message;
  onRetry: (id: string) => void;
}

const MessageBubble = memo(({ message, onRetry }: MessageBubbleProps) => {
  const handleRetry = useCallback(() => onRetry(message.id), [onRetry, message.id]);
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-primary-foreground mt-0.5",
          message.failed
            ? "bg-destructive"
            : message.role === "assistant"
              ? "bg-primary"
              : "bg-muted-foreground"
        )}
      >
        {message.failed ? (
          <AlertCircle className="size-4" />
        ) : message.role === "assistant" ? (
          <Bot className="size-4" />
        ) : (
          <User className="size-4" />
        )}
      </div>

      <div className={cn("flex flex-col gap-1.5", isUser && "items-end")}>
        <div className={cn("prose prose-sm max-w-none leading-relaxed", isUser && "text-right")}>
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        </div>

        {message.failed && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive transition-colors hover:bg-destructive/20"
          >
            <RotateCcw className="size-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = "MessageBubble";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cancel any in-flight request if the component unmounts.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const requestAssistantReply = useCallback(async (history: Message[]) => {
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...CHAT_MODEL, messages: history }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;

      console.error("Chat request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong while generating a response.",
          createdAt: new Date(),
          failed: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    (content: string, attachments?: MessageAttachment[]) => {
      if (isLoading) return;
      if (!content.trim() && !attachments?.length) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
        attachments,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      void requestAssistantReply(updatedMessages);
    },
    [messages, isLoading, requestAssistantReply]
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);
      if (!hasText && !hasAttachments) return;

      sendMessage(message.text ?? "", message.files as MessageAttachment[] | undefined);
    },
    [sendMessage]
  );

  const handleRetry = useCallback(
    (failedMessageId: string) => {
      if (isLoading) return;

      const failedIndex = messages.findIndex((m) => m.id === failedMessageId);
      if (failedIndex === -1) return;

      // Drop the failed assistant message and re-send everything up to (and including)
      // the preceding user turn.
      const historyBeforeFailure = messages.slice(0, failedIndex);
      setMessages(historyBeforeFailure);
      void requestAssistantReply(historyBeforeFailure);
    },
    [messages, isLoading, requestAssistantReply]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">How can I help you?</h1>

          <div className="mt-2 w-full max-w-3xl">
            <ChatPromptInput isLoading={isLoading} onSubmit={handleSubmit} />
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                aria-label={`Use starter prompt: ${prompt}`}
                className="rounded-full border bg-sidebar px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto" role="log" aria-live="polite">
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onRetry={handleRetry} />
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-0.5">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="bg-sidebar px-4 pb-4 pt-2">
            <div className="mx-auto max-w-3xl">
              <ChatPromptInput isLoading={isLoading} onSubmit={handleSubmit} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}