import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Send,
} from "lucide-react";
import { useChat } from "@/lib/useChat";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  EmptyState,
  GlassCard,
  PageHeader,
  Pill,
  SearchInput,
  Spinner,
} from "@/components/ui";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}

export default function Messages() {
  usePageTitle("Messages");
  const [searchParams, setSearchParams] = useSearchParams();
  const chat = useChat();
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-open ?with=convoId
  useEffect(() => {
    if (chat.loading) return;
    const id = searchParams.get("with");
    if (id && chat.conversations.some((c) => c.id === id)) {
      chat.openConversation(id);
      setMobileShowChat(true);
      // strip the param so a refresh doesn't keep re-opening
      const next = new URLSearchParams(searchParams);
      next.delete("with");
      setSearchParams(next, { replace: true });
    }
  }, [chat.loading, chat.conversations.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chat.conversations;
    return chat.conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [chat.conversations, search]);

  const active = chat.conversations.find(
    (c) => c.id === chat.activeConversationId,
  );

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    chat.sendMessage(text);
    setDraft("");
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Reach out to users about their viewings or anything else."
      />

      <div
        className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4"
        style={{ minHeight: "calc(100vh - 220px)" }}
      >
        {/* ─── Conversation list ─── */}
        <GlassCard
          className={`!p-0 overflow-hidden flex flex-col ${
            mobileShowChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-border-light flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search conversations…"
            />
            <span
              className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                chat.connected ? "bg-green-500" : "bg-amber-400"
              }`}
              title={chat.connected ? "Connected" : "Reconnecting…"}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {chat.loading ? (
              <div className="py-14 flex justify-center">
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="w-6 h-6" />}
                title="No conversations yet"
                message='Start one from a viewing — click "Message Buyer" on the Viewings page.'
              />
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    chat.openConversation(c.id);
                    setMobileShowChat(true);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border-light/60 transition-colors flex gap-3 items-start ${
                    c.id === chat.activeConversationId
                      ? "bg-primary/5"
                      : "hover:bg-white/40"
                  }`}
                >
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {c.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-primary-dark text-sm truncate">
                        {c.name}
                      </p>
                      <span className="text-text-subtle text-[11px] shrink-0">
                        {relativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.role && (
                        <Pill
                          variant={
                            c.role === "AGENT"
                              ? "info"
                              : c.role === "VENDOR"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {c.role}
                        </Pill>
                      )}
                    </div>
                    <p className="text-text-secondary text-xs truncate mt-1">
                      {c.lastMessageIsYou && (
                        <span className="text-text-subtle">You: </span>
                      )}
                      {c.lastMessage || "(no messages yet)"}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unread > 9 ? "9+" : c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </GlassCard>

        {/* ─── Thread ─── */}
        <GlassCard
          className={`!p-0 overflow-hidden flex flex-col ${
            mobileShowChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {active ? (
            <>
              <div className="px-5 py-3 border-b border-border-light flex items-center gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="lg:hidden w-8 h-8 rounded-full bg-white/60 border border-border-light flex items-center justify-center text-primary-dark"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {active.avatar ? (
                  <img
                    src={active.avatar}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {active.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-dark text-sm truncate">
                    {active.name}
                  </p>
                  <p className="text-text-subtle text-[11px] truncate">
                    {active.role}
                    {chat.otherTyping && (
                      <span className="ml-2 text-primary">typing…</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
                {chat.messagesLoading ? (
                  <div className="py-14 flex justify-center">
                    <Spinner />
                  </div>
                ) : chat.messages.length === 0 ? (
                  <p className="text-text-subtle text-sm text-center py-8">
                    No messages yet — say hi.
                  </p>
                ) : (
                  chat.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.isYou ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          m.isYou
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-white/70 border border-border-light text-primary-dark rounded-bl-sm"
                        }`}
                      >
                        <p className="leading-snug whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                        <p
                          className={`text-[10px] mt-1 flex items-center gap-1 ${
                            m.isYou ? "text-white/70" : "text-text-subtle"
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.isYou && <CheckCheck className="w-3 h-3" />}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={endRef} />
              </div>

              <div className="px-4 py-3 border-t border-border-light flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    chat.setTyping(e.target.value.length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 resize-none rounded-2xl bg-white/60 border border-border-light px-4 py-2.5 text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary focus:bg-white max-h-32"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={<MessageCircle className="w-6 h-6" />}
                title="Pick a conversation"
                message="Select a conversation on the left, or start a new one from a viewing."
              />
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
