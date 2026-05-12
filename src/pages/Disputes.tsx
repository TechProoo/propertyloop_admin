import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Wrench,
  Home,
  XCircle,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { reportsService } from "@/api/services";
import type { Report, ReportStatus, ReportTargetType } from "@/api/types";
import { cn } from "@/lib/cn";
import { usePageTitle } from "@/lib/usePageTitle";

const STATUS_OPTIONS: { value: ReportStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
];

const TYPE_OPTIONS: { value: ReportTargetType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "AGENT", label: "Agent Reports" },
  { value: "VENDOR", label: "Vendor Reports" },
  { value: "LISTING", label: "Listing Reports" },
];

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  REVIEWED: "bg-blue-100 text-blue-800 border-blue-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  DISMISSED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_ICONS: Record<ReportStatus, React.ReactNode> = {
  PENDING: <Clock className="w-3 h-3" />,
  REVIEWED: <Shield className="w-3 h-3" />,
  RESOLVED: <CheckCircle className="w-3 h-3" />,
  DISMISSED: <XCircle className="w-3 h-3" />,
};

const TYPE_ICONS: Record<ReportTargetType, React.ReactNode> = {
  AGENT: <UserCheck className="w-3.5 h-3.5" />,
  VENDOR: <Wrench className="w-3.5 h-3.5" />,
  LISTING: <Home className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<ReportTargetType, string> = {
  AGENT: "bg-purple-100 text-purple-800 border-purple-200",
  VENDOR: "bg-orange-100 text-orange-800 border-orange-200",
  LISTING: "bg-teal-100 text-teal-800 border-teal-200",
};

function ReportCard({ report, onUpdate }: { report: Report; onUpdate: (updated: Report) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editStatus, setEditStatus] = useState<ReportStatus>(report.status);
  const [adminNote, setAdminNote] = useState(report.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    editStatus !== report.status || adminNote !== (report.adminNote ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await reportsService.update(report.id, {
        status: editStatus,
        adminNote: adminNote || undefined,
      });
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                TYPE_COLORS[report.targetType],
              )}
            >
              {TYPE_ICONS[report.targetType]}
              {report.targetType === "AGENT"
                ? "Agent"
                : report.targetType === "VENDOR"
                  ? "Vendor"
                  : "Listing"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                STATUS_COLORS[report.status],
              )}
            >
              {STATUS_ICONS[report.status]}
              {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(report.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="text-sm text-gray-800 font-medium line-clamp-2">
            {report.reason}
          </p>
          {report.reporter && (
            <p className="text-xs text-gray-400 mt-1">
              By{" "}
              <span className="font-medium text-gray-500">
                {report.reporter.name}
              </span>{" "}
              ({report.reporter.email})
            </p>
          )}
          {!report.reporter && (
            <p className="text-xs text-gray-400 mt-1">Anonymous report</p>
          )}
        </div>
        <div className="shrink-0 text-gray-400 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Target ID
            </p>
            <p className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 break-all">
              {report.targetId}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Full Reason
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 leading-relaxed">
              {report.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Update Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ReportStatus)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Admin Note
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add an internal note about this report…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                isDirty && !saving
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Disputes() {
  usePageTitle("Disputes & Reports");

  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | "">("");
  const [search, setSearch] = useState("");

  async function load(p = page) {
    setLoading(true);
    try {
      const res = await reportsService.list({
        page: p,
        limit: 20,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { targetType: typeFilter } : {}),
      });
      setReports(res.items);
      setTotal(res.total);
      setPages(res.pages);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  function handleUpdate(updated: Report) {
    setReports((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );
  }

  const filtered = search.trim()
    ? reports.filter(
        (r) =>
          r.reason.toLowerCase().includes(search.toLowerCase()) ||
          r.reporter?.name.toLowerCase().includes(search.toLowerCase()) ||
          r.reporter?.email.toLowerCase().includes(search.toLowerCase()) ||
          r.targetId.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-primary-dark text-2xl">
            Disputes & Reports
          </h2>
          <p className="text-text-subtle text-sm mt-0.5">
            {total} report{total !== 1 ? "s" : ""} submitted
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingCount} pending review
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 border border-white/60 text-sm font-medium text-primary-dark hover:bg-white/90 transition-all shadow-sm"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { label: "Total", value: total, color: "text-primary-dark", bg: "bg-white/70" },
            {
              label: "Pending",
              value: reports.filter((r) => r.status === "PENDING").length,
              color: "text-amber-700",
              bg: "bg-amber-50/80",
            },
            {
              label: "Resolved",
              value: reports.filter((r) => r.status === "RESOLVED").length,
              color: "text-green-700",
              bg: "bg-green-50/80",
            },
            {
              label: "Dismissed",
              value: reports.filter((r) => r.status === "DISMISSED").length,
              color: "text-gray-600",
              bg: "bg-gray-50/80",
            },
          ] as const
        ).map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-2xl border border-white/60 px-4 py-3 shadow-sm",
              stat.bg,
            )}
          >
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reason, reporter, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-white/60 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "")}
            className="text-sm border border-white/60 rounded-xl px-3 py-2.5 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportTargetType | "")}
            className="text-sm border border-white/60 rounded-xl px-3 py-2.5 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-subtle gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading reports…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No reports found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || statusFilter || typeFilter
              ? "Try adjusting your filters"
              : "No reports have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && !search && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 rounded-xl text-sm border border-white/60 bg-white/70 disabled:opacity-40 hover:bg-white/90 transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 px-2">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="px-4 py-2 rounded-xl text-sm border border-white/60 bg-white/70 disabled:opacity-40 hover:bg-white/90 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
