import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone, Trash2 } from "lucide-react";
import { adminService } from "@/api/services";
import type { AppWaitlistEntry } from "@/api/types";
import {
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  Pill,
  SearchInput,
  Spinner,
} from "@/components/ui";

const SOURCE_LABELS: Record<string, string> = {
  homepage_cta: "Homepage CTA",
  footer: "Footer",
};

export default function AppWaitlist() {
  const [items, setItems] = useState<AppWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [working, setWorking] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listAppWaitlist({
        limit: 200,
        search: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load app waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { total: items.length };
    for (const e of items) {
      const key = e.source ?? "unknown";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const remove = async (id: string) => {
    if (!confirm("Delete this app-waitlist entry?")) return;
    setWorking((w) => ({ ...w, [id]: true }));
    try {
      await adminService.deleteAppWaitlistEntry(id);
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
      const blob = await adminService.exportAppWaitlist();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `app-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
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
        title="App Waitlist"
        subtitle='Subscribers from the homepage "Coming Soon" mobile-app modal.'
        actions={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by email…"
            />
            <Button onClick={exportCsv} disabled={exporting}>
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <GlassCard className="!p-4">
          <p className="text-text-subtle text-[11px] uppercase tracking-wider font-semibold mb-1">
            Total
          </p>
          <p className="font-heading font-bold text-primary-dark text-2xl">
            {counts.total ?? 0}
          </p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-text-subtle text-[11px] uppercase tracking-wider font-semibold mb-1">
            Homepage CTA
          </p>
          <p className="font-heading font-bold text-primary-dark text-2xl">
            {counts.homepage_cta ?? 0}
          </p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-text-subtle text-[11px] uppercase tracking-wider font-semibold mb-1">
            Other
          </p>
          <p className="font-heading font-bold text-primary-dark text-2xl">
            {(counts.total ?? 0) - (counts.homepage_cta ?? 0)}
          </p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-text-subtle text-[11px] uppercase tracking-wider font-semibold mb-1">
            Notified
          </p>
          <p className="font-heading font-bold text-primary-dark text-2xl">
            {items.filter((i) => i.notifiedAt).length}
          </p>
        </GlassCard>
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
            icon={<Smartphone className="w-6 h-6" />}
            title="No subscribers yet"
            message='Subscribers from the homepage "Coming Soon" modal will appear here.'
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-subtle text-[11px] uppercase tracking-wider border-b border-border-light">
                  <th className="text-left font-medium px-5 py-3">Email</th>
                  <th className="text-left font-medium px-5 py-3">Source</th>
                  <th className="text-left font-medium px-5 py-3">Notified</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border-light/60 hover:bg-white/40"
                  >
                    <td className="px-5 py-3 font-medium text-primary-dark">
                      {e.email}
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-xs">
                      {SOURCE_LABELS[e.source ?? ""] ?? e.source ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {e.notifiedAt ? (
                        <Pill variant="success">
                          {new Date(e.notifiedAt).toLocaleDateString()}
                        </Pill>
                      ) : (
                        <Pill variant="warn">Pending</Pill>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-subtle text-xs">
                      {new Date(e.createdAt).toLocaleString()}
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

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border-light">
            {items.map((e) => (
              <div key={e.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-primary-dark truncate">
                      {e.email}
                    </p>
                    <p className="text-text-subtle text-xs">
                      {SOURCE_LABELS[e.source ?? ""] ?? e.source ?? "—"}
                    </p>
                  </div>
                  {e.notifiedAt ? (
                    <Pill variant="success">Notified</Pill>
                  ) : (
                    <Pill variant="warn">Pending</Pill>
                  )}
                </div>
                <p className="text-text-subtle text-[11px] mt-2">
                  Joined {new Date(e.createdAt).toLocaleString()}
                </p>
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
