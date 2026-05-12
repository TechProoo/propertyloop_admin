import { api } from "./client";

export interface ConversationPreview {
  id: string;
  listingId?: string | null;
  productId?: string | null;
  name: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  otherUserId: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageIsYou: boolean;
  unread: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  senderAvatar: string | null;
  isYou: boolean;
  text: string;
  attachmentUrls: string[];
  createdAt: string;
}

const messagesService = {
  async listConversations(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<{
      items: ConversationPreview[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>("/messages/conversations", { params });
    return data;
  },

  async getMessages(
    conversationId: string,
    params?: { limit?: number; before?: string },
  ) {
    const { data } = await api.get<ChatMessage[]>(
      `/messages/conversations/${conversationId}`,
      { params },
    );
    return data;
  },

  async sendMessage(conversationId: string, text: string, attachmentUrls?: string[]) {
    const { data } = await api.post<ChatMessage>(
      `/messages/conversations/${conversationId}`,
      { text, ...(attachmentUrls?.length ? { attachmentUrls } : {}) },
    );
    return data;
  },

  async uploadAttachment(file: File): Promise<{ url: string; mimeType: string }> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ url: string; mimeType: string }>(
      "/upload/message-attachment",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  /**
   * Admin-only: start (or resume) a conversation with any user. Optionally
   * tie it to a listing (or a viewing — backend resolves the listing from
   * the viewing).
   */
  async startConversation(payload: {
    recipientId: string;
    listingId?: string;
    viewingId?: string;
    text?: string;
  }) {
    const { data } = await api.post<{
      conversationId: string;
      created: boolean;
    }>("/admin/messages/start", payload);
    return data;
  },
};

export default messagesService;
