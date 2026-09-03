import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpRight, ArrowDownRight, RefreshCcw, CheckCircle2, XCircle, Clock, Plus, Loader2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useState, useMemo } from "react"
import { format } from "date-fns"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute("/economy")({
  head: () => ({
    meta: [{ title: "الاقتصاد والعملات | ستريم برو" }],
  }),
  component: EconomyPage,
})

type Transaction = {
  _id: string
  user: { _id: string, displayName: string, username: string }
  type: string
  amount: number
  description: string
  status: "pending" | "completed" | "failed" | "refunded"
  createdAt: string
}

function EconomyPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Adjust Form State
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['admin_transactions', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const res = await api.get('/transactions/admin/all', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        }
      })
      return res.data as { data: Transaction[], total: number }
    }
  });

  const transactions = data?.data || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const adjustMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/transactions/admin/adjust', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_transactions'] })
      toast.success("تم تنفيذ العملية بنجاح")
      setIsDialogOpen(false)
      setUserId("")
      setAmount("")
      setDescription("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "فشل تنفيذ العملية")
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await api.patch(`/transactions/admin/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_transactions'] })
      toast.success("تم تحديث الحالة")
    },
    onError: () => toast.error("فشل التحديث")
  });

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      accessorKey: "_id",
      header: "رقم العملية",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground" title={row.original._id}>#{row.original._id.slice(-6)}</span>,
    },
    {
      accessorKey: "user",
      header: "المستخدم",
      cell: ({ row }) => {
        const u = row.original.user
        return (
          <div className="flex flex-col">
            <span className="font-bold">{u?.displayName || 'مجهول'}</span>
            <span className="text-xs text-muted-foreground">@{u?.username || 'unknown'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "نوع العملية",
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {type === 'deposit' || type === 'admin_adjustment' ? (
              <><ArrowUpRight className="size-4 text-success" /> {type === 'admin_adjustment' ? 'تعديل إداري' : 'إيداع/شحن'}</>
            ) : type === 'withdrawal' ? (
              <><ArrowDownRight className="size-4 text-warning" /> سحب</>
            ) : type === 'store_purchase' ? (
               <><RefreshCcw className="size-4 text-primary" /> شراء من المتجر</>
            ) : (
              <><RefreshCcw className="size-4 text-primary" /> {type}</>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "القيمة (عملة)",
      cell: ({ row }) => {
        const amount = row.original.amount
        return (
          <span className={`font-bold ${amount >= 0 ? 'text-success' : 'text-destructive'}`}>
            {amount > 0 ? '+' : ''}{amount.toLocaleString()} 🪙
          </span>
        )
      },
    },
    {
      accessorKey: "description",
      header: "الوصف",
      cell: ({ row }) => <span className="text-sm truncate max-w-[150px] inline-block" title={row.original.description}>{row.original.description}</span>,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {status === "completed" ? (
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-4" /> مكتملة
              </span>
            ) : status === "pending" ? (
              <span className="flex items-center gap-1.5 text-warning">
                <Clock className="size-4" /> قيد المعالجة
              </span>
            ) : status === "refunded" ? (
              <span className="flex items-center gap-1.5 text-primary">
                <RefreshCcw className="size-4" /> مسترجعة
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-destructive">
                <XCircle className="size-4" /> فشلت
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "التاريخ",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
        } catch {
          return "غير معروف"
        }
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tx = row.original
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
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(tx._id)
                toast.success("تم نسخ رقم العملية")
              }}>
                نسخ رقم العملية
              </DropdownMenuItem>
              {tx.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-success" onClick={() => updateStatusMutation.mutate({ id: tx._id, status: 'completed' })}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> اعتماد العملية
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => updateStatusMutation.mutate({ id: tx._id, status: 'failed' })}>
                    <XCircle className="mr-2 h-4 w-4" /> رفض العملية
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [updateStatusMutation]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;
    
    setIsSubmitting(true);
    adjustMutation.mutate({
      user: userId,
      amount: Number(amount),
      description: description || 'تعديل إداري للرصيد'
    }, {
      onSettled: () => setIsSubmitting(false)
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الاقتصاد والعملات" 
        description="متابعة عمليات الشحن وتحويل العملات للمستخدمين وإدارة الأرصدة." 
        action={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 size-4" /> تعديل رصيد مستخدم
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل رصيد مستخدم (إضافة / خصم)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">معرف المستخدم (User ID)</Label>
              <Input 
                id="userId" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required 
                placeholder="أدخل معرف الـ ObjectID الخاص بالمستخدم" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">القيمة (عملة)</Label>
              <Input 
                id="amount" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
                placeholder="أدخل رقماً موجباً للإضافة أو سالباً للخصم (مثال: 500 أو -100)" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">سبب التعديل (يظهر للمستخدم)</Label>
              <Textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: تعويض عن خطأ فني" 
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تنفيذ التعديل
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading && transactions.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل المعاملات...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={transactions} 
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  )
}
