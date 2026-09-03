import { createFileRoute } from "@tanstack/react-router";
import { Coins, Gift, Radio, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Avatar, DataTable, Panel, Pill, StatCard, Td } from "@/components/admin/ui-kit";
import {
  giftBreakdown,
  monthlySeries,
  weeklySeries,
} from "@/lib/mock/data.service";
import { cn, fmt } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية | ستريم برو — لوحة تحكم البث المباشر" },
      {
        name: "description",
        content:
          "نظرة عامة على أداء منصة البث: المستخدمون، البثوث المباشرة، الإيرادات والهدايا الافتراضية.",
      },
      { property: "og:title", content: "الرئيسية | ستريم برو" },
      {
        property: "og:description",
        content: "مؤشرات الأداء اللحظية لمنصة البث المباشر في لوحة واحدة.",
      },
    ],
  }),
  component: Dashboard,
});

const ranges = [
  { id: "7d", label: "آخر 7 أيام" },
  { id: "30d", label: "آخر 30 يوماً" },
  { id: "year", label: "آخر سنة" },
] as const;

const donutColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-pop">
      <p className="mb-1 text-xs font-bold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-semibold text-muted-foreground">
          <span
            className="ml-1 inline-block size-2 rounded-full align-middle"
            style={{ background: p.color }}
          />
          {p.name}: <span className="tabular-nums text-foreground">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Dashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("year");
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const res = await api.get("/stats/admin/dashboard");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const series = useMemo(() => {
    if (range === "7d") return weeklySeries;
    if (range === "30d") return monthlySeries.slice(-4);
    return monthlySeries;
  }, [range]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي المستخدمين" value={isLoading ? "..." : fmt(data?.totalUsers || 0)} icon={Users} />
        <StatCard label="البثوث المباشرة الحالية" value={isLoading ? "..." : fmt(data?.activeStreams || 0)} icon={Radio} />
        <StatCard
          label="إجمالي الإيرادات"
          value={isLoading ? "..." : `${fmt(data?.totalRevenue || 0)} ر.س`}
          icon={Coins}
        />
        <StatCard label="الهدايا المستلمة" value={isLoading ? "..." : fmt(data?.giftsReceived || 0)} icon={Gift} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="نمو الإيرادات وتفاعل المشاهدين"
          subtitle="مقارنة الإيرادات (أعمدة) بعدد المشاهدين (خط)"
          actions={
            <div className="flex gap-1 rounded-xl bg-secondary p-1">
              {ranges.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                    range === r.id
                      ? "bg-card text-primary shadow-card"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-[320px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  reversed
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="revenue"
                  name="الإيرادات"
                  fill="var(--color-chart-1)"
                  radius={[8, 8, 0, 0]}
                  barSize={22}
                />
                <Line
                  dataKey="viewers"
                  name="المشاهدون"
                  stroke="var(--color-chart-2)"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="نظرة عامة على الهدايا" subtitle="توزيع أنواع الهدايا الافتراضية">
          <div className="h-[240px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={giftBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                >
                  {giftBreakdown.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {giftBreakdown.map((g, i) => (
              <li key={g.name} className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: donutColors[i % donutColors.length] }}
                />
                <span className="flex-1">{g.name}</span>
                <span className="tabular-nums text-muted-foreground">{g.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="أفضل المذيعين أداءً"
          subtitle="خلال آخر 30 يوماً"
          padded={false}
        >
          <DataTable head={["المذيع", "الإيرادات", "متوسط المشاهدين", "عدد الهدايا"]}>
            {data?.topStreamers?.map((s: any) => (
              <tr key={s.id} className="transition hover:bg-secondary/50">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} hue={s.avatarHue} />
                    <span className="font-bold">{s.name}</span>
                  </div>
                </Td>
                <Td className="tabular-nums font-bold">{fmt(s.revenue)} ر.س</Td>
                <Td className="tabular-nums">{fmt(s.avgViewers)}</Td>
                <Td className="tabular-nums">{fmt(s.gifts)}</Td>
              </tr>
            )) || <tr><td colSpan={4} className="text-center text-muted-foreground py-4">لا توجد بيانات</td></tr>}
          </DataTable>
        </Panel>

        <Panel title="النشاط الأخير" subtitle="آخر الأحداث على المنصة">
          <ol className="relative space-y-4 pr-4">
            <span className="absolute bottom-2 right-1 top-2 w-px bg-border" />
            {data?.recentActivity?.map((a: any) => (
              <li key={a.id} className="relative pr-4">
                <span
                  className={cn(
                    "absolute right-[-3px] top-1.5 size-2 rounded-full",
                    a.kind === "report"
                      ? "bg-destructive"
                      : a.kind === "cashout"
                        ? "bg-warning"
                        : a.kind === "gift"
                          ? "bg-chart-3"
                          : "bg-primary",
                  )}
                />
                <p className="text-xs font-semibold leading-relaxed">{a.text}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(a.time).toLocaleString('ar-SA')}</p>
              </li>
            )) || <p className="text-sm text-muted-foreground pr-4">لا يوجد نشاط أخير</p>}
          </ol>
        </Panel>
      </div>

      <Panel title="تنبيهات تشغيلية" subtitle="عناصر تحتاج إجراءً إدارياً">
        <div className="flex flex-wrap gap-2">
          {data?.operationalAlerts?.pendingReports > 0 && (
            <Pill tone="danger">{data.operationalAlerts.pendingReports} بلاغات قيد الانتظار</Pill>
          )}
          {data?.operationalAlerts?.openTickets > 0 && (
            <Pill tone="warning">{data.operationalAlerts.openTickets} تذاكر دعم مفتوحة</Pill>
          )}
          {(!data?.operationalAlerts || (data.operationalAlerts.pendingReports === 0 && data.operationalAlerts.openTickets === 0)) && (
            <Pill tone="success">لا توجد تنبيهات تشغيلية معلقة حالياً</Pill>
          )}
        </div>
      </Panel>
    </div>
  );
}
