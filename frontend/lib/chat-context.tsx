"use client";

import * as React from "react";
import { nanoid } from "nanoid";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  streamingStack?: string[]; // Stack to store streaming chunks
  files?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
};

export type Chat = {
  id: string;
  slug: string;
  title: string;
  messages: ChatMessage[];
  model?: string;
  createdAt: number;
  updatedAt: number;
};

type ChatContextValue = {
  chats: Chat[];
  selectedChatId: string | null;
  selectChat: (chatId: string) => void;
  createChat: (title?: string, model?: string) => { id: string; slug: string };
  addMessage: (chatId: string, message: Omit<ChatMessage, "id" | "createdAt">) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  sendMessage: (chatId: string, content: string, model?: string, files?: File[]) => Promise<void>;
  getChatBySlug: (slug: string) => Chat | null;
  pushStreamingChunk: (chatId: string, messageId: string, chunk: string) => void;
  popStreamingChunk: (chatId: string, messageId: string) => string | undefined;
  finishStreamingMessage: (chatId: string, messageId: string) => void;
  getStreamingContent: (chatId: string, messageId: string) => string;
};

const ChatContext = React.createContext<ChatContextValue | null>(null);

function generateSlug(): string {
  return nanoid(10);
}

const initialChats: Chat[] = [
  {
    id: nanoid(),
    slug: generateSlug(),
    title: "Summarize the documents in the right order in the folder",
    messages: [
      { id: nanoid(), role: "user", content: "Summarize the documents in the folder", createdAt: Date.now() - 100000 },
      { id: nanoid(), role: "assistant", content: "Sure — do you want a bullet list or a narrative summary?", createdAt: Date.now() - 90000 },
    ],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 90000,
  },
  {
    id: nanoid(),
    slug: generateSlug(),
    title: "Generate a marketing email",
    messages: [
      { id: nanoid(), role: "user", content: "Write a launch email for our new feature.", createdAt: Date.now() - 80000 },
    ],
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = React.useState<Chat[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("chat_state_v1") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.chats)) return parsed.chats as Chat[];
      }
    } catch {}
    return initialChats;
  });
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("chat_state_v1") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.selectedChatId) return parsed.selectedChatId as string;
      }
    } catch {}
    return initialChats[0]?.id ?? null;
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        "chat_state_v1",
        JSON.stringify({ chats, selectedChatId })
      );
    } catch {}
  }, [chats, selectedChatId]);

  const selectChat = React.useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  const createChat = React.useCallback((title: string = "New chat", model: string = "gpt-4o") => {
    const id = nanoid();
    const slug = generateSlug();
    const newChat: Chat = {
      id,
      slug,
      title,
      messages: [],
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(id);
    return { id, slug };
  }, []);

  const addMessage = React.useCallback(
    (chatId: string, message: Omit<ChatMessage, "id" | "createdAt">, customId?: string) => {
      const messageId = customId || nanoid();
      
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: messageId, createdAt: Date.now(), ...message },
                ],
                updatedAt: Date.now(),
              }
            : c
        )
      );
      
      // Auto-title a chat from the first user message
      if (message.role === "user") {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId && (c.title === "New chat" || c.title.trim().length === 0)
              ? { ...c, title: message.content.slice(0, 60), updatedAt: Date.now() }
              : c
          )
        );
      }
      
      return messageId; // Return the ID so we can use it
    },
    []
  );

  const updateMessage = React.useCallback(
    (chatId: string, messageId: string, updates: Partial<ChatMessage>) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, ...updates } : m
                ),
                updatedAt: Date.now(),
              }
            : c
        )
      );
    },
    []
  );

  // Push a new chunk to the streaming stack
  const pushStreamingChunk = React.useCallback(
    (chatId: string, messageId: string, chunk: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId 
                    ? { 
                        ...m, 
                        isStreaming: true,
                        streamingStack: [...(m.streamingStack || []), chunk],
                        content: (m.streamingStack || []).concat(chunk).join('')
                      } 
                    : m
                ),
                updatedAt: Date.now(),
              }
            : c
        )
      );
    },
    []
  );

  // Pop the top chunk from the streaming stack
  const popStreamingChunk = React.useCallback(
    (chatId: string, messageId: string): string | undefined => {
      let poppedChunk: string | undefined;
      
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === messageId && m.streamingStack && m.streamingStack.length > 0) {
                    const newStack = [...m.streamingStack];
                    poppedChunk = newStack.pop();
                    return {
                      ...m,
                      streamingStack: newStack,
                      content: newStack.join('') // Update content with remaining stack
                    };
                  }
                  return m;
                }),
                updatedAt: Date.now(),
              }
            : c
        )
      );
      
      return poppedChunk;
    },
    []
  );

  // Get the current streaming content by joining all chunks in the stack
  const getStreamingContent = React.useCallback(
    (chatId: string, messageId: string): string => {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) return '';
      
      const message = chat.messages.find(m => m.id === messageId);
      if (!message || !message.streamingStack) return message?.content || '';
      
      return message.streamingStack.join('');
    },
    [chats]
  );



  const finishStreamingMessage = React.useCallback(
    (chatId: string, messageId: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === messageId) {
                    // Join all chunks and set as final content
                    const finalContent = m.streamingStack ? m.streamingStack.join('') : m.content;
                    return { 
                      ...m, 
                      isStreaming: false, 
                      content: finalContent,
                      streamingStack: undefined // Clear the stack
                    };
                  }
                  return m;
                }),
                updatedAt: Date.now(),
              }
            : c
        )
      );
    },
    []
  );

  const sendMessage = React.useCallback(async (chatId: string, content: string, model: string = "gpt-4o", files?: File[]) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    // Add user message with files
    const fileInfo = files?.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    })) || [];
    
    addMessage(chatId, { 
      role: "user", 
      content,
      files: fileInfo
    });

    // Create streaming assistant message with empty stack
    const assistantMessageId = addMessage(chatId, { 
      role: "assistant", 
      content: "", 
      isStreaming: true,
      streamingStack: []
    });

    try {
      // Call FastAPI backend /ask endpoint
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: content,
          session_id: chat.sessionId || null, // Use chat's session ID if available
        }),
      });

      if (!response.ok) {
        throw new Error(`FastAPI backend error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the assistant message with the response
      updateMessage(assistantMessageId, {
        content: data.answer,
        isStreaming: false,
        streamingStack: []
      });

      // Update chat with session ID if provided
      if (data.session_id && !chat.sessionId) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId ? { ...c, sessionId: data.session_id, updatedAt: Date.now() } : c
          )
        );
      }

      // Update chat model if it's different
      if (chat.model !== model) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId ? { ...c, model, updatedAt: Date.now() } : c
          )
        );
      }
    } catch (error) {
      // Update the assistant message with error content
      updateMessage(assistantMessageId, {
        content: "Sorry, I encountered an error. Please try again.",
        isStreaming: false,
        streamingStack: []
      });
    }
  }, [chats, addMessage, updateMessage, setChats]);

  const deleteChat = React.useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setSelectedChatId((current) => (current === chatId ? null : current));
  }, []);

  const renameChat = React.useCallback((chatId: string, title: string) => {
    setChats((prev) => 
      prev.map((c) => 
        c.id === chatId ? { ...c, title, updatedAt: Date.now() } : c
      )
    );
  }, []);

  const getChatBySlug = React.useCallback((slug: string) => {
    return chats.find(c => c.slug === slug) || null;
  }, [chats]);

  const value = React.useMemo(
    () => ({ 
      chats, 
      selectedChatId, 
      selectChat, 
      createChat, 
      addMessage, 
      updateMessage, 
      deleteChat, 
      renameChat,
      sendMessage,
      getChatBySlug,
      pushStreamingChunk,
      popStreamingChunk,
      finishStreamingMessage,
      getStreamingContent,
    }),
    [chats, selectedChatId, selectChat, createChat, addMessage, updateMessage, deleteChat, renameChat, sendMessage, getChatBySlug, pushStreamingChunk, popStreamingChunk, finishStreamingMessage, getStreamingContent]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}


