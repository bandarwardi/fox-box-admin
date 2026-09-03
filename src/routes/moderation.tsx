import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, AlertTriangle, CheckCircle2, XCircle, Search, Ban } from "lucide-react"
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

export const Route = createFileRoute("/moderation")({
  head: () => ({
    meta: [{ title: "الرقابة والبلاغات | ستريم برو" }],
  }),
  component: ModerationPage,
})

type Report = {
  _id: string
  reporter: { _id: string, displayName: string, username: string }
  reportedUser?: { _id: string, displayName: string, username: string }
  reportedBroadcast?: { _id: string, title: string, isLive: boolean }
  reason: string
  details?: string
  status: "pending" | "reviewed" | "dismissed"
  actionTaken?: string
  createdAt: string
}

function ModerationPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_reports', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const res = await api.get('/reports/admin', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        }
      })
      return res.data as { data: Report[], total: number }
    }
  });

  const reports = data?.data || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, actionTaken }: { id: string, status: string, actionTaken?: string }) => {
      await api.patch(`/reports/admin/${id}`, { status, actionTaken })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reports'] })
      toast.success("تم تحديث حالة البلاغ")
      setIsDetailsOpen(false)
    },
    onError: () => toast.error("فشل في تحديث حالة البلاغ")
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/admin/${userId}/status`, { status: 'banned' })
    },
    onSuccess: () => toast.success("تم حظر المستخدم بنجاح"),
    onError: () => toast.error("فشل في حظر المستخدم")
  });

  const columns = useMemo<ColumnDef<Report>[]>(() => [
    {
      accessorKey: "reporter",
      header: "صاحب البلاغ",
      cell: ({ row }) => <span className="font-medium text-muted-foreground">{row.original.reporter?.displayName || row.original.reporter?.username || 'مجهول'}</span>,
    },
    {
      accessorKey: "reported",
      header: "المُبلّغ عنه",
      cell: ({ row }) => {
        if (row.original.reportedUser) return <span className="font-bold text-foreground">{row.original.reportedUser.displayName}</span>
        if (row.original.reportedBroadcast) return <span className="font-bold text-foreground">بث: {row.original.reportedBroadcast.title}</span>
        return <span>غير محدد</span>
      },
    },
    {
      accessorKey: "reason",
      header: "سبب البلاغ",
      cell: ({ row }) => (
        <div className="max-w-[250px] truncate" title={row.original.reason}>
          {row.original.reason}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {status === "pending" ? (
              <span className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="size-4" /> قيد الانتظار
              </span>
            ) : status === "reviewed" ? (
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-4" /> تمت المراجعة
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <XCircle className="size-4" /> تم التجاهل
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
        const report = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">فتح القائمة</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>إجراءات الرقابة</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setSelectedReport(report);
                setIsDetailsOpen(true);
              }}>
                <Search className="mr-2 h-4 w-4" /> مراجعة التفاصيل
              </DropdownMenuItem>
              {report.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-muted-foreground" onClick={() => updateStatusMutation.mutate({ id: report._id, status: 'dismissed', actionTaken: 'لا يوجد إجراء' })}>
                    <XCircle className="mr-2 h-4 w-4" /> تجاهل البلاغ
                  </DropdownMenuItem>
                  {report.reportedUser && (
                    <DropdownMenuItem className="text-destructive" onClick={() => {
                      if (window.confirm("هل أنت متأكد من حظر هذا المستخدم؟")) {
                        banUserMutation.mutate(report.reportedUser._id)
                        updateStatusMutation.mutate({ id: report._id, status: 'reviewed', actionTaken: 'تم حظر المستخدم' })
                      }
                    }}>
                      <Ban className="mr-2 h-4 w-4" /> حظر المُبلّغ عنه
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [updateStatusMutation, banUserMutation]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الرقابة والبلاغات" 
        description="إدارة ومراجعة البلاغات المقدمة من المستخدمين، واتخاذ الإجراءات اللازمة لضمان بيئة آمنة في المنصة." 
      />

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل البلاغ</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 border-b pb-4">
                <div>
                  <span className="text-muted-foreground block mb-1">صاحب البلاغ</span>
                  <span className="font-semibold">{selectedReport.reporter?.displayName} (@{selectedReport.reporter?.username})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">الطرف المُبلّغ عنه</span>
                  {selectedReport.reportedUser ? (
                    <span className="font-semibold">{selectedReport.reportedUser.displayName} (@{selectedReport.reportedUser.username})</span>
                  ) : selectedReport.reportedBroadcast ? (
                    <span className="font-semibold">بث: {selectedReport.reportedBroadcast.title}</span>
                  ) : (
                    <span>غير محدد</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">السبب</span>
                <p className="font-medium bg-secondary p-2 rounded-md">{selectedReport.reason}</p>
              </div>
              {selectedReport.details && (
                <div>
                  <span className="text-muted-foreground block mb-1">تفاصيل إضافية</span>
                  <p className="bg-secondary p-2 rounded-md whitespace-pre-wrap">{selectedReport.details}</p>
                </div>
              )}
              {selectedReport.actionTaken && (
                <div>
                  <span className="text-muted-foreground block mb-1">الإجراء المتخذ</span>
                  <p className="bg-success/20 text-success p-2 rounded-md font-bold">{selectedReport.actionTaken}</p>
                </div>
              )}

              {selectedReport.status === 'pending' && (
                <div className="pt-4 flex gap-2">
                  <Button variant="destructive" className="flex-1" onClick={() => {
                     if (selectedReport.reportedUser) {
                        banUserMutation.mutate(selectedReport.reportedUser._id)
                        updateStatusMutation.mutate({ id: selectedReport._id, status: 'reviewed', actionTaken: 'تم حظر المستخدم' })
                     } else {
                       toast.error("لا يمكن حظر البث حالياً من هنا، اذهب لصفحة البثوث")
                     }
                  }}>
                    حظر المُبلّغ عنه
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: selectedReport._id, status: 'dismissed', actionTaken: 'لم يتم اتخاذ إجراء' })}>
                    تجاهل
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading && reports.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل البلاغات...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={reports} 
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  )
}
