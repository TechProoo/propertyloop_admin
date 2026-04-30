import { useEffect, useMemo, useState } from "react";
import { Users as UsersIcon } from "lucide-react";
import { adminService } from "@/api/services";
import type { Role, User } from "@/api/types";
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

const ROLE_FILTERS: { value: "ALL" | Role; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "BUYER", label: "Buyers" },
  { value: "AGENT", label: "Agents" },
  { value: "VENDOR", label: "Vendors" },
  { value: "ADMIN", label: "Admins" },
];

export default function Users() {
  usePageTitle("Users");
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [working, setWorking] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listUsers({
        limit: 200,
        search: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load users");
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

  const filtered = useMemo(
    () =>
      roleFilter === "ALL"
        ? items
        : items.filter((u) => u.role === roleFilter),
    [items, roleFilter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: items.length };
    for (const u of items) map[u.role] = (map[u.role] ?? 0) + 1;
    return map;
  }, [items]);

  const toggleSuspend = async (u: User) => {
    if (
      !u.isActive
        ? !confirm(`Reinstate ${u.name}?`)
        : !confirm(`Suspend ${u.name}? They will be unable to log in.`)
    ) {
      return;
    }
    setWorking((w) => ({ ...w, [u.id]: true }));
    try {
      const updated = await adminService.setUserActive(u.id, !u.isActive);
      setItems((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: updated.isActive } : x)),
      );
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update user");
    } finally {
      setWorking((w) => ({ ...w, [u.id]: false }));
    }
  };

  const roleVariant = (role: Role): React.ComponentProps<typeof Pill>["variant"] => {
    switch (role) {
      case "AGENT":
        return "info";
      case "VENDOR":
        return "warn";
      case "ADMIN":
        return "primary";
      default:
        return "neutral";
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="All accounts on the platform. Suspend or reinstate from here."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />}
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value)}
            className={`shrink-0 px-4 h-9 rounded-full text-xs font-medium border transition-colors ${
              roleFilter === r.value
                ? "bg-primary text-white border-primary"
                : "bg-white/70 text-primary-dark border-border-light hover:border-primary"
            }`}
          >
            {r.label}
            {counts[r.value] !== undefined && (
              <span className="ml-1.5 opacity-70">({counts[r.value]})</span>
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
            icon={<UsersIcon className="w-6 h-6" />}
            title="No users"
            message="Try a different search or filter."
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          {/* Table on desktop, list on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-subtle text-[11px] uppercase tracking-wider border-b border-border-light">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Email</th>
                  <th className="text-left font-medium px-5 py-3">Role</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border-light/60 hover:bg-white/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {u.name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="font-medium text-primary-dark truncate">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary truncate">{u.email}</td>
                    <td className="px-5 py-3">
                      <Pill variant={roleVariant(u.role)}>{u.role}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      {u.isActive ? (
                        <Pill variant="success">Active</Pill>
                      ) : (
                        <Pill variant="danger">Suspended</Pill>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-subtle text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.isActive ? "danger" : "primary"}
                        disabled={working[u.id] || u.role === "ADMIN"}
                        onClick={() => toggleSuspend(u)}
                      >
                        {u.role === "ADMIN"
                          ? "—"
                          : u.isActive
                            ? "Suspend"
                            : "Reinstate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border-light">
            {filtered.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-start gap-3">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {u.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-primary-dark truncate">{u.name}</p>
                    <Pill variant={roleVariant(u.role)}>{u.role}</Pill>
                    {u.isActive ? (
                      <Pill variant="success">Active</Pill>
                    ) : (
                      <Pill variant="danger">Suspended</Pill>
                    )}
                  </div>
                  <p className="text-text-secondary text-xs truncate">{u.email}</p>
                  <p className="text-text-subtle text-[11px] mt-1">
                    Joined {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={u.isActive ? "danger" : "primary"}
                  disabled={working[u.id] || u.role === "ADMIN"}
                  onClick={() => toggleSuspend(u)}
                >
                  {u.role === "ADMIN" ? "—" : u.isActive ? "Suspend" : "Reinstate"}
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
