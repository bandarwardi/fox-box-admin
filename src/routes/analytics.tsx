import { createFileRoute } from "@tanstack/react-router"
import { Users, Video, DollarSign, Activity } from "lucide-react"
import { 
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Bar, BarChart, Legend
} from "recharts"

import { PageHeader } from "@/components/admin/page-header"

// Mock Data
const revenueData = [
  { name: "يناير", revenue: 4000, expenses: 2400 },
  { name: "فبراير", revenue: 3000, expenses: 1398 },
  { name: "مارس", revenue: 2000, expenses: 9800 },
  { name: "أبريل", revenue: 2780, expenses: 3908 },
  { name: "مايو", revenue: 1890, expenses: 4800 },
  { name: "يونيو", revenue: 2390, expenses: 3800 },
  { name: "يوليو", revenue: 3490, expenses: 4300 },
]

const usersData = [
  { name: "الأحد", new: 400, active: 2400 },
  { name: "الإثنين", new: 300, active: 1398 },
  { name: "الثلاثاء", new: 200, active: 9800 },
  { name: "الأربعاء", new: 278, active: 3908 },
  { name: "الخميس", new: 189, active: 4800 },
  { name: "الجمعة", new: 239, active: 3800 },
  { name: "السبت", new: 349, active: 4300 },
]

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [{ title: "الإحصائيات والتحليلات | ستريم برو" }],
  }),
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="الإحصائيات والتحليلات" 
        description="نظرة عامة على أداء المنصة، نمو المستخدمين، الإيرادات المالية." 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="font-semibold text-sm font-medium">إجمالي الإيرادات</h3>
            <DollarSign className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="font-semibold text-sm font-medium">مستخدمين جدد</h3>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">+2350</div>
          <p className="text-xs text-muted-foreground">+180.1% من الشهر الماضي</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="font-semibold text-sm font-medium">البثوث النشطة</h3>
            <Video className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">+12,234</div>
          <p className="text-xs text-muted-foreground">+19% من الشهر الماضي</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="font-semibold text-sm font-medium">المتصلين الآن</h3>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">+573</div>
          <p className="text-xs text-muted-foreground">+201 منذ آخر ساعة</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">نظرة عامة على الإيرادات</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">نمو المستخدمين (أسبوعياً)</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="active" name="نشطين" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="new" name="جدد" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
