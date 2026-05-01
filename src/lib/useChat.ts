import { useState, useEffect, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/api/socket";
import messagesService, {
  type ConversationPreview,
  type ChatMessage,
} from "@/api/messagesService";

export interface UseChatReturn {
  conversations: ConversationPreview[];
  messages: ChatMessage[];
  unreadCount: number;
  connected: boolean;
  loading: boolean;
  messagesLoading: boolean;
  activeConversationId: string | null;
  openConversation: (id: string) => void;
  sendMessage: (text: string) => void;
  setTyping: (isTyping: boolean) => void;
  otherTyping: boolean;
}

export function useChat(): UseChatReturn {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("connected", (data: { unread: number }) => {
      setUnreadCount(data.unread);
    });

    socket.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.length > 0 && prev[0]?.conversationId === msg.conversationId) {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        }
        return prev;
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.text,
                lastMessageAt: msg.createdAt,
                lastMessageIsYou: msg.isYou,
                unread: msg.isYou ? c.unread : c.unread + 1,
              }
            : c,
        ),
      );

      if (!msg.isYou) setUnreadCount((prev) => prev + 1);
    });

    socket.on(
      "unread_update",
      (data: { conversationId: string; unread: number }) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversationId ? { ...c, unread: data.unread } : c,
          ),
        );
      },
    );

    socket.on(
      "user_typing",
      (data: { conversationId: string; isTyping: boolean }) => {
        if (data.conversationId === activeIdRef.current) {
          setOtherTyping(data.isTyping);
          if (data.isTyping) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(
              () => setOtherTyping(false),
              3000,
            );
          }
        }
      },
    );

    socket.on("conversation_read", (data: { conversationId: string }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId ? { ...c, unread: 0 } : c,
        ),
      );
    });

    messagesService
      .listConversations({ limit: 50 })
      .then((res) => {
        setConversations(res.items);
        setUnreadCount(res.items.reduce((sum, c) => sum + c.unread, 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connected");
      socket.off("new_message");
      socket.off("unread_update");
      socket.off("user_typing");
      socket.off("conversation_read");
    };
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    activeIdRef.current = id;
    setOtherTyping(false);
    setMessages([]);
    setMessagesLoading(true);

    socketRef.current?.emit("join_conversation", { conversationId: id });

    try {
      const msgs = await messagesService.getMessages(id, { limit: 100 });
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !activeConversationId) return;
      socketRef.current?.emit("send_message", {
        conversationId: activeConversationId,
        text: text.trim(),
      });
      socketRef.current?.emit("typing", {
        conversationId: activeConversationId,
        isTyping: false,
      });
    },
    [activeConversationId],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      socketRef.current?.emit("typing", {
        conversationId: activeConversationId,
        isTyping,
      });
    },
    [activeConversationId],
  );

  return {
    conversations,
    messages,
    unreadCount,
    connected,
    loading,
    messagesLoading,
    activeConversationId,
    openConversation,
    sendMessage,
    setTyping,
    otherTyping,
  };
}
