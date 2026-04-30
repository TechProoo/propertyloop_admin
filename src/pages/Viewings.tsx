import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Home,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import { adminService } from "@/api/services";
import type { Viewing, ViewingStatus } from "@/api/types";
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

const STATUSES: { value: "ALL" | ViewingStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No-show" },
];

function statusVariant(s: ViewingStatus): React.ComponentProps<typeof Pill>["variant"] {
  switch (s) {
    case "CONFIRMED":
      return "info";
    case "PENDING":
      return "warn";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "NO_SHOW":
      return "neutral";
    default:
      return "neutral";
  }
}

export default function Viewings() {
  usePageTitle("Viewings");
  const [items, setItems] = useState<Viewing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | ViewingStatus>("ALL");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listViewings({
        limit: 100,
        status: filter === "ALL" ? undefined : filter,
        search: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load viewings");
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

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: items.length };
    for (const v of items) map[v.status] = (map[v.status] ?? 0) + 1;
    return map;
  }, [items]);

  const handleStatusChange = async (id: string, status: ViewingStatus) => {
    setUpdating((u) => ({ ...u, [id]: true }));
    setOpenMenu(null);
    actionLoader.show("Updating viewing…");
    try {
      const updated = await adminService.setViewingStatus(id, status);
      setItems((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
    } catch {
      // ignore
    } finally {
      setUpdating((u) => ({ ...u, [id]: false }));
      actionLoader.hide();
    }
  };

  const handleDelete = async (v: Viewing) => {
    if (!confirm(`Delete viewing for ${v.clientName}? This cannot be undone.`)) return;
    setUpdating((u) => ({ ...u, [v.id]: true }));
    actionLoader.show("Deleting viewing…");
    try {
      await adminService.deleteViewing(v.id);
      setItems((prev) => prev.filter((x) => x.id !== v.id));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete viewing");
    } finally {
      setUpdating((u) => ({ ...u, [v.id]: false }));
      actionLoader.hide();
    }
  };

  return (
    <div>
      <PageHeader
        title="Viewings"
        subtitle="All property viewings booked across the platform."
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by client, listing, phone…"
          />
        }
      />

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
            icon={<CalendarDays className="w-6 h-6" />}
            title="No viewings"
            message="Nothing matches the current filter."
          />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((v) => {
            const scheduled = new Date(v.scheduledFor);
            return (
              <GlassCard
                key={v.id}
                className={`relative ${openMenu === v.id ? "z-50" : "z-0"}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:gap-4 gap-3">
                  {/* Listing thumb */}
                  {v.listing?.coverImage ? (
                    <img
                      src={v.listing.coverImage}
                      alt={v.listing.title}
                      className="w-full md:w-28 h-28 md:h-24 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-full md:w-28 h-28 md:h-24 rounded-xl bg-bg-accent text-text-subtle flex items-center justify-center shrink-0">
                      <Home className="w-6 h-6" />
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-heading font-bold text-primary-dark text-sm truncate">
                        {v.listing?.title ?? "Listing"}
                      </h3>
                      <Pill variant={statusVariant(v.status)}>
                        {v.status.charAt(0) + v.status.slice(1).toLowerCase()}
                      </Pill>
                    </div>
                    {v.listing?.location && (
                      <p className="text-text-subtle text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {v.listing.location}
                      </p>
                    )}
                    <p className="text-text-secondary text-xs mt-1.5 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {scheduled.toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {scheduled.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-1 text-text-subtle text-[11px] mt-2">
                      <span>
                        <span className="text-text-secondary font-medium">Client:</span>{" "}
                        {v.clientName} · {v.clientPhone}
                      </span>
                      <span>
                        <span className="text-text-secondary font-medium">Agent:</span>{" "}
                        {v.agent?.name ?? "—"}
                        {v.agent?.email ? ` · ${v.agent.email}` : ""}
                      </span>
                    </div>

                    {v.notes && (
                      <p className="text-text-secondary text-xs mt-2 italic">
                        "{v.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap md:flex-col gap-2 md:items-end shrink-0">
                    {v.clientPhone && (
                      <a
                        href={`tel:${v.clientPhone}`}
                        className="h-8 px-3 rounded-full bg-white/70 border border-border-light text-primary-dark text-xs font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors inline-flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}

                    {/* Status changer */}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating[v.id]}
                        onClick={() => setOpenMenu(openMenu === v.id ? null : v.id)}
                        className="min-w-[110px] justify-between"
                      >
                        <span>{updating[v.id] ? "Saving…" : "Set status"}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                      {openMenu === v.id && (
                        <div className="absolute right-0 mt-1 z-50 glass-strong rounded-xl overflow-hidden shadow-xl min-w-[150px]">
                          {(
                            [
                              "PENDING",
                              "CONFIRMED",
                              "COMPLETED",
                              "CANCELLED",
                              "NO_SHOW",
                            ] as ViewingStatus[]
                          ).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(v.id, s)}
                              className="block w-full text-left px-3 py-2 text-xs hover:bg-primary/5 text-primary-dark"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="danger"
                      disabled={updating[v.id]}
                      onClick={() => handleDelete(v)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
