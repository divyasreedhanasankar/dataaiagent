import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useActiveConversation, useChatStore } from "@/stores/chat-store";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { PromptSuggestions } from "./PromptSuggestions";

export function ChatWindow() {
  const conversation = useActiveConversation();
  const { send, stop, regenerate, setFeedback, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.messages]);

  const empty = conversation.messages.length === 0;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <PromptSuggestions onPick={send} />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-8">
            <AnimatePresence initial={false}>
              {conversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRegenerate={regenerate}
                  onEdit={send}
                  onFeedback={(value) => setFeedback(message.id, value)}
                />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}
