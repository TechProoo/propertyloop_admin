import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldOff, Wrench, Phone, Mail } from "lucide-react";
import { adminService } from "@/api/services";
import type { User } from "@/api/types";
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

export default function Vendors() {
  usePageTitle("Vendors");
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("ALL");
  const [working, setWorking] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const verified =
        filter === "VERIFIED" ? true : filter === "UNVERIFIED" ? false : undefined;
      const res = await adminService.listVendors({
        limit: 100,
        verified,
        search: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load vendors");
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
    actionLoader.show(verified ? "Verifying vendor…" : "Unverifying vendor…");
    try {
      await adminService.setVendorVerified(id, verified);
      setItems((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                vendorProfile: {
                  ...(u.vendorProfile ?? { verified: false }),
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
    actionLoader.show(isActive ? "Suspending vendor…" : "Reinstating vendor…");
    try {
      const updated = await adminService.setUserActive(id, !isActive);
      setItems((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: updated.isActive } : u)),
      );
    } finally {
      setWorking((w) => ({ ...w, [id]: false }));
      actionLoader.hide();
    }
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="Service vendor accounts — verify, suspend, and review."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search vendors…" />}
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
        <GlassCard className="py-10 text-center text-red-600 text-sm">{error}</GlassCard>
      ) : items.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<Wrench className="w-6 h-6" />}
            title="No vendors found"
            message="Nothing matches the current filter."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((u, i) => {
            const verified = !!u.vendorProfile?.verified;
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
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
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
                      </div>
                      {u.vendorProfile?.serviceCategory && (
                        <p className="text-text-secondary text-xs truncate mt-0.5">
                          {u.vendorProfile.serviceCategory}
                          {u.vendorProfile.serviceArea
                            ? ` · ${u.vendorProfile.serviceArea}`
                            : ""}
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
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
