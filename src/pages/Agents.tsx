import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldOff,
  UserCheck,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  Crown,
  Zap,
  AlertTriangle,
  X,
} from "lucide-react";
import { adminService } from "@/api/services";
import messagesService from "@/api/messagesService";
import type { User, SubscriptionTier, SubscriptionStatus } from "@/api/types";
import {
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  Pill,
  SearchInput,
  Spinner,
} from "@/components/ui";
import { usePageTitle } from "@/lib/usePageTitle";
import { actionLoader } from "@/lib/actionLoader";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "VERIFIED", label: "Verified" },
  { value: "UNVERIFIED", label: "Unverified" },
] as const;

export default function Agents() {
  usePageTitle("Agents");
  const navigate = useNavigate();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["value"]>("ALL");

  const handleMessage = async (id: string) => {
    setWorking((w) => ({ ...w, [id]: true }));
    actionLoader.show("Opening conversation…");
    try {
      const res = await messagesService.startConversation({ recipientId: id });
      navigate(`/messages?with=${res.conversationId}`);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Couldn't start conversation");
    } finally {
      setWorking((w) => ({ ...w, [id]: false }));
      actionLoader.hide();
    }
  };
  const [working, setWorking] = useState<Record<string, boolean>>({});

  // ── Subscription override modal ────────────────────────────────────────
  const [overrideTarget, setOverrideTarget] = useState<User | null>(null);
  const [overrideTier, setOverrideTier] = useState<string>("STANDARD");
  const [overrideStatus, setOverrideStatus] = useState<string>("ACTIVE");
  const [overrideSaving, setOverrideSaving] = useState(false);

  const openOverride = (u: User) => {
    setOverrideTarget(u);
    setOverrideTier(u.agentProfile?.subscriptionTier ?? "STANDARD");
    setOverrideStatus(u.agentProfile?.subscriptionStatus ?? "ACTIVE");
  };

  const saveOverride = async () => {
    if (!overrideTarget) return;
    setOverrideSaving(true);
    try {
      await adminService.overrideAgentSubscription(
        overrideTarget.id,
        overrideTier,
        overrideStatus,
      );
      setItems((prev) =>
        prev.map((u) =>
          u.id === overrideTarget.id
            ? {
                ...u,
                agentProfile: {
                  ...u.agentProfile,
                  verified: u.agentProfile?.verified ?? false,
                  subscriptionTier: overrideTier as SubscriptionTier,
                  subscriptionStatus: overrideStatus as SubscriptionStatus,
                },
              }
            : u,
        ),
      );
      setOverrideTarget(null);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to save override");
    } finally {
      setOverrideSaving(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const verified =
        filter === "VERIFIED"
          ? true
          : filter === "UNVERIFIED"
            ? false
            : undefined;
      const res = await adminService.listAgents({
        limit: 100,
        verified,
        search: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setVerified = async (id: string, verified: boolean) => {
    setWorking((w) => ({ ...w, [id]: true }));
    actionLoader.show(verified ? "Verifying agent…" : "Unverifying agent…");
    try {
      await adminService.setAgentVerified(id, verified);
      setItems((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                agentProfile: {
                  ...(u.agentProfile ?? { verified: false }),
                  verified,
                },
              }
            : u,
        ),
      );
    } finally {
      setWorking((w) => ({ ...w, [id]: false }));
      actionLoader.hide();
    }
  };

  const toggleSuspend = async (id: string, isActive: boolean) => {
    setWorking((w) => ({ ...w, [id]: true }));
    actionLoader.show(isActive ? "Suspending agent…" : "Reinstating agent…");
    try {
      const updated = await adminService.setUserActive(id, !isActive);
      setItems((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, isActive: updated.isActive } : u,
        ),
      );
    } finally {
      setWorking((w) => ({ ...w, [id]: false }));
      actionLoader.hide();
    }
  };

  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle="Review agent applications, verify and suspend accounts."
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search agents…"
          />
        }
      />

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 h-9 rounded-full text-xs font-medium border transition-colors ${
              filter === f.value
                ? "bg-primary text-white border-primary"
                : "bg-white/70 text-primary-dark border-border-light hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <GlassCard className="py-14 flex justify-center">
          <Spinner />
        </GlassCard>
      ) : error ? (
        <GlassCard className="py-10 text-center text-red-600 text-sm">
          {error}
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<UserCheck className="w-6 h-6" />}
            title="No agents found"
            message="Nothing matches the current filter."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((u, i) => {
            const verified = !!u.agentProfile?.verified;
            const suspended = !u.isActive;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <GlassCard>
                  <div className="flex items-start gap-3">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {u.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-primary-dark text-sm truncate">
                          {u.name}
                        </h3>
                        {verified ? (
                          <Pill variant="success">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </Pill>
                        ) : (
                          <Pill variant="warn">Unverified</Pill>
                        )}
                        {suspended && <Pill variant="danger">Suspended</Pill>}
                        {/* Subscription tier badge */}
                        {u.agentProfile?.subscriptionTier === "FOUNDING" && (
                          <Pill variant="warn">
                            <Crown className="w-3 h-3" /> Founding
                          </Pill>
                        )}
                        {u.agentProfile?.subscriptionTier === "PRO" && (
                          <Pill variant="primary">
                            <Zap className="w-3 h-3" /> Pro
                          </Pill>
                        )}
                        {u.agentProfile?.subscriptionTier === "STANDARD" && (
                          <Pill variant="info">
                            <CreditCard className="w-3 h-3" /> Standard
                          </Pill>
                        )}
                        {/* Subscription status badge (only for lapsed/grace) */}
                        {u.agentProfile?.subscriptionStatus === "LAPSED" && (
                          <Pill variant="danger">
                            <AlertTriangle className="w-3 h-3" /> Lapsed
                          </Pill>
                        )}
                        {u.agentProfile?.subscriptionStatus ===
                          "GRACE_PERIOD" && (
                          <Pill variant="warn">
                            <AlertTriangle className="w-3 h-3" /> Grace Period
                          </Pill>
                        )}
                      </div>
                      {u.agentProfile?.agencyName && (
                        <p className="text-text-secondary text-xs truncate mt-0.5">
                          {u.agentProfile.agencyName}
                        </p>
                      )}
                      <div className="text-text-subtle text-[11px] mt-2 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            {u.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-text-subtle text-[11px] mt-2">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      variant={verified ? "outline" : "primary"}
                      disabled={working[u.id]}
                      onClick={() => setVerified(u.id, !verified)}
                    >
                      {verified ? (
                        <>
                          <ShieldOff className="w-3.5 h-3.5" /> Unverify
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Verify
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={suspended ? "primary" : "danger"}
                      disabled={working[u.id]}
                      onClick={() => toggleSuspend(u.id, u.isActive)}
                    >
                      {suspended ? "Reinstate" : "Suspend"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={working[u.id]}
                      onClick={() => handleMessage(u.id)}
                      title={`Message ${u.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openOverride(u)}
                      title="Override subscription"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Subscription
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Subscription override modal ── */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
          >
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-heading font-bold text-primary-dark text-lg">
                Override Subscription
              </h4>
              <button
                onClick={() => setOverrideTarget(null)}
                className="w-8 h-8 rounded-full text-text-secondary hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              {overrideTarget.name} · {overrideTarget.email}
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1.5">
                  Subscription Tier
                </label>
                <select
                  value={overrideTier}
                  onChange={(e) => setOverrideTier(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-primary-dark bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="FOUNDING">Founding — free forever</option>
                  <option value="STANDARD">Standard — ₦5,000/mo</option>
                  <option value="PRO">Pro — ₦12,000/mo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1.5">
                  Subscription Status
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-primary-dark bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="GRACE_PERIOD">Grace Period</option>
                  <option value="LAPSED">Lapsed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOverrideTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={overrideSaving}
                onClick={saveOverride}
              >
                {overrideSaving ? "Saving…" : "Save override"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
