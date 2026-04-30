import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Home, ChevronDown, MapPin, Bed, Bath } from "lucide-react";
import { adminService } from "@/api/services";
import type { Listing, ListingStatus } from "@/api/types";
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

const STATUSES: { value: "ALL" | ListingStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "SOLD", label: "Sold" },
  { value: "RENTED", label: "Rented" },
  { value: "ARCHIVED", label: "Archived" },
];

function statusVariant(s: ListingStatus): React.ComponentProps<typeof Pill>["variant"] {
  switch (s) {
    case "ACTIVE":
      return "primary";
    case "PENDING_REVIEW":
      return "warn";
    case "SOLD":
      return "success";
    case "RENTED":
      return "info";
    case "ARCHIVED":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Listings() {
  usePageTitle("Listings");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | ListingStatus>("ALL");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listListings({
        limit: 100,
        status: filter === "ALL" ? undefined : filter,
        search: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: items.length };
    for (const i of items) map[i.status] = (map[i.status] ?? 0) + 1;
    return map;
  }, [items]);

  const handleStatusChange = async (id: string, status: ListingStatus) => {
    setUpdating((u) => ({ ...u, [id]: true }));
    setOpenMenu(null);
    actionLoader.show("Updating listing…");
    try {
      const updated = await adminService.setListingStatus(id, status);
      setItems((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    } catch {
      // ignore
    } finally {
      setUpdating((u) => ({ ...u, [id]: false }));
      actionLoader.hide();
    }
  };

  return (
    <div>
      <PageHeader
        title="Listings"
        subtitle="Review, approve and moderate property listings."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search by title, address, location…" />}
      />

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`shrink-0 px-4 h-9 rounded-full text-xs font-medium border transition-colors ${
              filter === s.value
                ? "bg-primary text-white border-primary"
                : "bg-white/70 text-primary-dark border-border-light hover:border-primary"
            }`}
          >
            {s.label}
            {counts[s.value] !== undefined && (
              <span className="ml-1.5 opacity-70">({counts[s.value]})</span>
            )}
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
            icon={<Home className="w-6 h-6" />}
            title="No listings"
            message="Nothing matches the current filter."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <GlassCard
                className={`p-0 relative ${
                  openMenu === l.id ? "z-50" : "z-0"
                }`}
              >
                {l.coverImage ? (
                  <img
                    src={l.coverImage}
                    alt={l.title}
                    className="w-full h-40 object-cover rounded-t-2xl"
                  />
                ) : (
                  <div className="w-full h-40 bg-bg-accent flex items-center justify-center text-text-subtle rounded-t-2xl">
                    <Home className="w-8 h-8" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-heading font-bold text-primary-dark text-sm truncate">
                      {l.title}
                    </h3>
                    <Pill variant={statusVariant(l.status)}>{l.status}</Pill>
                  </div>
                  <p className="text-text-subtle text-xs flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5" /> {l.location}
                  </p>
                  <p className="font-heading font-bold text-primary-dark text-base">
                    {l.priceLabel}
                  </p>
                  <div className="flex items-center gap-3 text-text-secondary text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" /> {l.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" /> {l.baths}
                    </span>
                  </div>

                  {l.agent && (
                    <p className="text-text-subtle text-[11px] mt-2 truncate">
                      Listed by {l.agent.name}
                      {l.agent.agentProfile?.agencyName
                        ? ` · ${l.agent.agentProfile.agencyName}`
                        : ""}
                    </p>
                  )}

                  {/* Status changer */}
                  <div className="relative mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)}
                      disabled={updating[l.id]}
                      className="w-full justify-between"
                    >
                      <span>{updating[l.id] ? "Saving…" : "Set status"}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                    {openMenu === l.id && (
                      <div className="absolute left-0 right-0 mt-1 z-50 glass-strong rounded-xl overflow-hidden shadow-xl">
                        {(
                          [
                            "PENDING_REVIEW",
                            "ACTIVE",
                            "PAUSED",
                            "SOLD",
                            "RENTED",
                            "ARCHIVED",
                          ] as ListingStatus[]
                        ).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(l.id, s)}
                            className="block w-full text-left px-3 py-2 text-xs hover:bg-primary/5 text-primary-dark"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
