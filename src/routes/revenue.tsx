import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/admin/ui-kit"
import { BRAND } from "@/config/brand"

// Mock Data
type Withdrawal = {
  id: string
  streamerName: string
  amountUSD: number
  status: "pending" | "approved" | "rejected"
  date: string
}

const mockWithdrawals: Withdrawal[] = [
  { id: "w1", streamerName: "أحمد محمد", amountUSD: 500, status: "pending", date: "2023-10-25 10:00" },
  { id: "w2", streamerName: "نورة فهد", amountUSD: 1200, status: "approved", date: "2023-10-24 15:30" },
  { id: "w3", streamerName: "بندر محمد", amountUSD: 300, status: "rejected", date: "2023-10-23 09:15" },
  { id: "w4", streamerName: "سارة خالد", amountUSD: 850, status: "pending", date: "2023-10-25 11:45" },
]

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [{ title: `الأرباح والسحوبات | ${BRAND.shortArabicName}` }],
  }),
  component: RevenuePage,
})

const columns: ColumnDef<Withdrawal>[] = [
  {
    accessorKey: "id",
    header: "رقم الطلب",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.getValue("id")}</span>,
  },
  {
    accessorKey: "streamerName",
    header: "المذيع",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.streamerName} hue={Math.floor(Math.random() * 360)} />
        <span className="font-bold">{row.getValue("streamerName")}</span>
      </div>
    ),
  },
  {
    accessorKey: "amountUSD",
    header: "المبلغ (دولار)",
    cell: ({ row }) => {
      const amount = row.getValue("amountUSD") as number
      return (
        <span className="flex items-center gap-1 font-bold text-success">
          <DollarSign className="size-4" /> {amount.toLocaleString()}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {status === "approved" ? (
            <span className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4" /> تم التحويل
            </span>
          ) : status === "pending" ? (
            <span className="flex items-center gap-1.5 text-warning">
              <Clock className="size-4" /> قيد المراجعة
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-destructive">
              <XCircle className="size-4" /> مرفوض
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "تاريخ الطلب",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const withdrawal = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
            {withdrawal.status === "pending" && (
              <>
                <DropdownMenuItem className="text-success">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> اعتماد وتحويل
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <XCircle className="mr-2 h-4 w-4" /> رفض الطلب
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>تفاصيل حساب البنك</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function RevenuePage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="size-5" />
            <h3 className="font-semibold">أرباح المنصة (هذا الشهر)</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">$12,450.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-5" />
            <h3 className="font-semibold">طلبات سحب معلقة</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-warning">$1,350.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-5" />
            <h3 className="font-semibold">إجمالي المسحوبات</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-success">$45,200.00</p>
        </div>
      </div>

      <PageHeader 
        title="طلبات سحب الأرباح" 
        description="مراجعة واعتماد طلبات سحب الأرباح المقدمة من المذيعين والوكالات." 
      />
      <DataTable 
        columns={columns} 
        data={mockWithdrawals} 
        searchKey="streamerName" 
        searchPlaceholder="ابحث باسم المذيع..." 
      />
    </div>
  )
}
