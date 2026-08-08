import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message, ErrorPayload } from "@/types";
import { processSteps, titleFor } from "@/lib/ai-engine";
import { formatResponse } from "@/lib/response-formatter";
import { DATABASES } from "@/lib/mock-data";
import { askDataMind, ApiError } from "@/services/api";

const uid = () => Math.random().toString(36).slice(2, 11);

// ==========================================
// CHAT STATE INTERFACE
// ==========================================

interface ChatState {
  conversations: Conversation[];
  activeId: string;
  isStreaming: boolean;
  activeDatabaseId: string;
  provider: string;
  model: string;
  timers: ReturnType<typeof setTimeout>[];

  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  togglePin: (id: string) => void;
  setDatabase: (id: string) => void;
  setModel: (model: string) => void;

  send: (text: string) => void;
  stop: () => void;
  regenerate: () => void;
  setFeedback: (
    messageId: string,
    value: "up" | "down"
  ) => void;
}

// ==========================================
// EMPTY CONVERSATION
// ==========================================

const emptyConversation = (): Conversation => ({
  id: uid(),
  title: "New conversation",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pinned: false,
  messages: [],
});

// ==========================================
// ERROR PAYLOAD BUILDER
// ==========================================

function buildErrorPayload(error: unknown): ErrorPayload {
  if (error instanceof ApiError) {
    const hints: Record<string, string> = {
      connection: "Make sure the FastAPI server is running: uvicorn main:app --reload --port 8000",
      quota: "Check your Gemini API quota at https://ai.google.dev/",
      model_unavailable: "Verify GEMINI_API_KEY and model name in backend/.env",
      timeout: "Try a simpler question or check backend performance",
      sql_error: "The AI-generated SQL had an issue. Try rephrasing your question.",
      auth: "Verify GEMINI_API_KEY in backend/.env",
    };

    return {
      title:
        error.errorType === "connection"
          ? "Connection Error"
          : error.errorType === "quota"
          ? "Rate Limit Reached"
          : error.errorType === "timeout"
          ? "Request Timeout"
          : error.errorType === "sql_error"
          ? "Query Error"
          : "Analysis Error",
      message: error.userMessage,
      hint: hints[error.errorType],
    };
  }

  if (error instanceof TypeError) {
    return {
      title: "Connection Error",
      message: "Unable to connect to the DataMind AI backend.",
      hint: "Make sure the FastAPI server is running at http://127.0.0.1:8000",
    };
  }

  return {
    title: "Unexpected Error",
    message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
  };
}

// ==========================================
// STORE (WITH PERSISTENCE)
// ==========================================

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const first = emptyConversation();

      const clearTimers = () => {
        get().timers.forEach((timer) => clearTimeout(timer));
        set({ timers: [] });
      };

      const patchActive = (
        fn: (conversation: Conversation) => Conversation
      ) => {
        set((state) => ({
          conversations: state.conversations.map(
            (conversation) =>
              conversation.id === state.activeId
                ? fn(conversation)
                : conversation
          ),
        }));
      };

      const patchMessage = (
        id: string,
        patch: Partial<Message>
      ) => {
        patchActive((conversation) => ({
          ...conversation,
          updatedAt: Date.now(),
          messages: conversation.messages.map(
            (message) =>
              message.id === id
                ? { ...message, ...patch }
                : message
          ),
        }));
      };

      const advanceSteps = (
        assistantId: string,
        stepIndex: number,
        status: "active" | "done"
      ) => {
        const state = get();
        const conversation = state.conversations.find(
          (c) => c.id === state.activeId
        );
        const message = conversation?.messages.find(
          (m) => m.id === assistantId
        );
        if (!message?.steps) return;

        const newSteps = message.steps.map((step, i) => {
          if (i < stepIndex) return { ...step, status: "done" as const };
          if (i === stepIndex) return { ...step, status };
          return step;
        });

        patchMessage(assistantId, { steps: newSteps });
      };

      // ==========================================
      // REAL BACKEND REQUEST & RESPONSE FORMATTING
      // ==========================================

      const run = async (question: string) => {
        const assistantId = uid();
        const steps = processSteps();

        patchActive((conversation) => ({
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: assistantId,
              role: "assistant",
              content: "",
              createdAt: Date.now(),
              streaming: true,
              steps,
              feedback: null,
            },
          ],
        }));

        set({ isStreaming: true });

        try {
          // Step animations
          advanceSteps(assistantId, 0, "done");
          advanceSteps(assistantId, 1, "active");
          await new Promise((r) => setTimeout(r, 60));
          advanceSteps(assistantId, 1, "done");
          advanceSteps(assistantId, 2, "active");

          // Call backend
          const response = await askDataMind(question);

          advanceSteps(assistantId, 2, "done");
          advanceSteps(assistantId, 3, "active");
          await new Promise((r) => setTimeout(r, 60));
          advanceSteps(assistantId, 3, "done");
          advanceSteps(assistantId, 4, "active");
          await new Promise((r) => setTimeout(r, 60));
          advanceSteps(assistantId, 4, "done");
          advanceSteps(assistantId, 5, "active");
          await new Promise((r) => setTimeout(r, 60));
          advanceSteps(assistantId, 5, "done");
          advanceSteps(assistantId, 6, "active");
          await new Promise((r) => setTimeout(r, 60));
          advanceSteps(assistantId, 6, "done");

          // Handle unsuccessful backend responses
          if (!response.success) {
            const errorMsg =
              response.answer ||
              "An error occurred while processing your question. Please try rephrasing.";
            patchMessage(assistantId, {
              content: errorMsg,
              streaming: false,
              steps: undefined,
              error: {
                title: "Analysis Error",
                message: errorMsg,
              },
            });
            set({ isStreaming: false, timers: [] });
            return;
          }

          // Pass directly to UniversalResponseFormatter
          const formatted = formatResponse(question, response);

          // Store formatted payloads directly on message
          patchMessage(assistantId, {
            content: formatted.content,
            sql: formatted.sql,
            table: formatted.table,
            chart: formatted.chart ?? undefined,
            insights: formatted.insights,
            streaming: false,
            steps: processSteps().map((step) => ({
              ...step,
              status: "done" as const,
            })),
          });

          set({ isStreaming: false, timers: [] });
        } catch (error) {
          console.error("DataMind API Error:", error);

          const errorPayload = buildErrorPayload(error);

          patchMessage(assistantId, {
            content: errorPayload.message,
            streaming: false,
            steps: undefined,
            error: errorPayload,
          });

          set({ isStreaming: false, timers: [] });
        }
      };

      return {
        conversations: [first],
        activeId: first.id,
        isStreaming: false,
        activeDatabaseId: DATABASES[0].id,
        provider: "Gemini",
        model: "DataMind AI",
        timers: [],

        newConversation: () => {
          clearTimers();
          const conversation = emptyConversation();
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            activeId: conversation.id,
            isStreaming: false,
          }));
        },

        selectConversation: (id) => {
          clearTimers();
          set({ activeId: id, isStreaming: false });
        },

        deleteConversation: (id) =>
          set((state) => {
            const remaining = state.conversations.filter(
              (conversation) => conversation.id !== id
            );
            const next =
              remaining.length > 0 ? remaining : [emptyConversation()];
            return {
              conversations: next,
              activeId:
                state.activeId === id ? next[0].id : state.activeId,
            };
          }),

        togglePin: (id) =>
          set((state) => ({
            conversations: state.conversations.map(
              (conversation) =>
                conversation.id === id
                  ? { ...conversation, pinned: !conversation.pinned }
                  : conversation
            ),
          })),

        setDatabase: (id) => set({ activeDatabaseId: id }),
        setModel: (model) => set({ model }),

        send: (text) => {
          const question = text.trim();
          if (!question || get().isStreaming) return;

          patchActive((conversation) => ({
            ...conversation,
            title:
              conversation.messages.length === 0
                ? titleFor(question)
                : conversation.title,
            updatedAt: Date.now(),
            messages: [
              ...conversation.messages,
              {
                id: uid(),
                role: "user",
                content: question,
                createdAt: Date.now(),
              },
            ],
          }));

          run(question);
        },

        stop: () => {
          clearTimers();
          patchActive((conversation) => ({
            ...conversation,
            messages: conversation.messages.map(
              (message) =>
                message.streaming
                  ? { ...message, streaming: false, steps: undefined }
                  : message
            ),
          }));
          set({ isStreaming: false });
        },

        regenerate: () => {
          const state = get();
          const conversation = state.conversations.find(
            (conversation) => conversation.id === state.activeId
          );

          if (!conversation || state.isStreaming) return;

          const lastUserMessage = [...conversation.messages]
            .reverse()
            .find((message) => message.role === "user");

          if (!lastUserMessage) return;

          patchActive((conversation) => {
            const index = conversation.messages.findIndex(
              (message) => message.id === lastUserMessage.id
            );
            return {
              ...conversation,
              messages: conversation.messages.slice(0, index + 1),
            };
          });

          run(lastUserMessage.content);
        },

        setFeedback: (messageId, value) =>
          patchActive((conversation) => ({
            ...conversation,
            messages: conversation.messages.map(
              (message) =>
                message.id === messageId
                  ? {
                      ...message,
                      feedback: message.feedback === value ? null : value,
                    }
                  : message
            ),
          })),
      };
    },
    {
      name: "datamind-chat-storage",

      partialize: (state) => ({
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            streaming: false,
            steps: undefined,
          })),
        })),
        activeId: state.activeId,
        activeDatabaseId: state.activeDatabaseId,
      }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Reset streaming states
        state.conversations = state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            streaming: false,
            steps: undefined,
          })),
        }));

        if (state.conversations.length === 0) {
          const first = emptyConversation();
          state.conversations = [first];
          state.activeId = first.id;
        }

        const exists = state.conversations.some((c) => c.id === state.activeId);
        if (!exists) {
          state.activeId = state.conversations[0].id;
        }
      },
    }
  )
);

export const useActiveConversation = () =>
  useChatStore(
    (state) =>
      state.conversations.find(
        (conversation) => conversation.id === state.activeId
      ) ?? state.conversations[0]
  );

export const useActiveDatabase = () =>
  useChatStore(
    (state) =>
      DATABASES.find(
        (database) => database.id === state.activeDatabaseId
      ) ?? DATABASES[0]
  );