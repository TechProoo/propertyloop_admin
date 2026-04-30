import { useEffect, useMemo, useState } from "react";
import {
  Download,
  ListChecks,
  MapPin,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { waitlistService } from "@/api/services";
import type { WaitlistEntry } from "@/api/types";
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

const TYPE_LABELS: Record<string, string> = {
  REAL_ESTATE_AGENT: "Real Estate Agent",
  BUILDER: "Builder",
  BUILDING_MATERIALS_SUPPLIER_INSTALLER: "Building Materials",
  PARTNER_INVESTOR: "Partner / Investor",
};

const TABS: { value: "ALL" | WaitlistEntry["type"]; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "REAL_ESTATE_AGENT", label: "Agents" },
  { value: "BUILDER", label: "Builders" },
  { value: "BUILDING_MATERIALS_SUPPLIER_INSTALLER", label: "Suppliers" },
  { value: "PARTNER_INVESTOR", label: "Partners" },
];

export default function Waitlist() {
  usePageTitle("Waitlist");
  const [items, setItems] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("ALL");
  const [working, setWorking] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await waitlistService.list();
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((e) => {
      const matchesTab = tab === "ALL" || e.type === tab;
      const matchesSearch =
        !q ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [items, search, tab]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: items.length };
    for (const e of items) map[e.type] = (map[e.type] ?? 0) + 1;
    return map;
  }, [items]);

  const remove = async (id: string) => {
    if (!confirm("Delete this waitlist entry? This cannot be undone.")) return;
    setWorking((w) => ({ ...w, [id]: true }));
    try {
      await waitlistService.remove(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete entry");
    } finally {
      setWorking((w) => ({ ...w, [id]: false }));
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await waitlistService.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Waitlist"
        subtitle="People who pre-registered before launch."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search waitlist…" />
            <Button onClick={exportCsv} disabled={exporting}>
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </>
        }
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 px-4 h-9 rounded-full text-xs font-medium border transition-colors ${
              tab === t.value
                ? "bg-primary text-white border-primary"
                : "bg-white/70 text-primary-dark border-border-light hover:border-primary"
            }`}
          >
            {t.label}
            {counts[t.value] !== undefined && (
              <span className="ml-1.5 opacity-70">({counts[t.value]})</span>
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
      ) : filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<ListChecks className="w-6 h-6" />}
            title="No waitlist entries"
            message="Adjust the filters to find a different group."
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-subtle text-[11px] uppercase tracking-wider border-b border-border-light">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Type</th>
                  <th className="text-left font-medium px-5 py-3">Contact</th>
                  <th className="text-left font-medium px-5 py-3">Location</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border-light/60 hover:bg-white/40"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-primary-dark">
                        {e.first_name} {e.last_name}
                      </p>
                      {e.company_name && (
                        <p className="text-text-subtle text-xs">{e.company_name}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-xs">
                      {TYPE_LABELS[e.type] ?? e.type}
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-xs">
                      <p className="truncate">{e.email}</p>
                      <p className="text-text-subtle">{e.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-xs">
                      {e.location ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {e.activated ? (
                        <Pill variant="success">Activated</Pill>
                      ) : (
                        <Pill variant="warn">Pending</Pill>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-subtle text-xs">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={working[e.id]}
                        onClick={() => remove(e.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border-light">
            {filtered.map((e) => (
              <div key={e.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-primary-dark truncate">
                      {e.first_name} {e.last_name}
                    </p>
                    <p className="text-text-subtle text-xs">
                      {TYPE_LABELS[e.type] ?? e.type}
                    </p>
                  </div>
                  {e.activated ? (
                    <Pill variant="success">Activated</Pill>
                  ) : (
                    <Pill variant="warn">Pending</Pill>
                  )}
                </div>
                <div className="text-text-secondary text-xs mt-2 flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {e.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {e.phone}
                  </span>
                  {e.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {e.location}
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={working[e.id]}
                    onClick={() => remove(e.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
