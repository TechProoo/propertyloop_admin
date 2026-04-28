import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  UserCheck,
  Wrench,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { adminService } from "@/api/services";
import type { AdminOverview } from "@/api/types";
import { GlassCard, PageHeader, Spinner } from "@/components/ui";

const cards: {
  key: keyof AdminOverview;
  label: string;
  Icon: typeof Building2;
  tint: string;
}[] = [
  {
    key: "totalUsers",
    label: "Total Users",
    Icon: Users,
    tint: "bg-primary/10 text-primary",
  },
  {
    key: "totalAgents",
    label: "Agents",
    Icon: UserCheck,
    tint: "bg-blue-50 text-blue-600",
  },
  {
    key: "totalVendors",
    label: "Vendors",
    Icon: Wrench,
    tint: "bg-amber-50 text-amber-600",
  },
  {
    key: "totalListings",
    label: "Total Listings",
    Icon: Building2,
    tint: "bg-purple-50 text-purple-600",
  },
  {
    key: "activeListings",
    label: "Active Listings",
    Icon: TrendingUp,
    tint: "bg-green-50 text-green-700",
  },
  {
    key: "totalOrders",
    label: "Orders",
    Icon: ClipboardList,
    tint: "bg-rose-50 text-rose-600",
  },
];

export default function Overview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService
      .overview()
      .then((d) => active && setData(d))
      .catch((err) =>
        active &&
        setError(err?.response?.data?.message ?? "Failed to load overview"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="A snapshot of platform activity right now."
      />

      {loading ? (
        <GlassCard className="py-16 flex justify-center">
          <Spinner />
        </GlassCard>
      ) : error ? (
        <GlassCard className="py-10 text-center text-red-600 text-sm">
          {error}
        </GlassCard>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ key, label, Icon, tint }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="hover:shadow-[0_8px_28px_rgba(31,111,67,0.12)] transition-shadow">
                <div className={`w-10 h-10 rounded-2xl ${tint} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-text-secondary text-xs font-medium">
                  {label}
                </p>
                <p className="font-heading font-bold text-primary-dark text-3xl mt-1">
                  {(data[key] ?? 0).toLocaleString("en-NG")}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
