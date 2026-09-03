import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { ShieldAlert, ShieldCheck, MoreHorizontal, Ban, CheckCircle } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { useState, useMemo } from "react"

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

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [{ title: "إدارة المستخدمين | ستريم برو" }],
  }),
  component: UsersPage,
})

type RealUser = {
  _id: string
  displayName: string
  username: string
  email: string
  isBanned: boolean
  isDeleted: boolean
  role?: string
  createdAt: string
  avatarUrl?: string
}

function UsersPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['admin_users', pagination.pageIndex, pagination.pageSize, search],
    queryFn: async () => {
      const res = await api.get('/users/admin/all', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: search || undefined
        }
      })
      return res.data as { data: RealUser[], total: number }
    }
  });

  const users = data?.data || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'banned' }) => {
      await api.patch(`/users/admin/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] })
      toast.success("تم تحديث حالة المستخدم بنجاح")
    },
    onError: () => {
      toast.error("فشل في تحديث حالة المستخدم")
    }
  });

  const columns = useMemo<ColumnDef<RealUser>[]>(() => [
    {
      accessorKey: "displayName",
      header: "المستخدم",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Avatar name={user.displayName || user.username || 'مستخدم'} hue={Math.floor(Math.random() * 360)} />
            )}
            <div className="flex flex-col">
              <span className="font-bold">{user.displayName || user.username || 'بدون اسم'}</span>
              <span className="text-xs text-muted-foreground">{user.email || '@' + user.username}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "الدور",
      cell: ({ row }) => {
        const role = row.original.role || "user"
        return (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
            {role === "admin" ? "مدير" : role === "streamer" ? "مذيع" : "مستخدم"}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const isBanned = row.original.isBanned
        const isDeleted = row.original.isDeleted
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {isDeleted ? (
              <><span className="size-2 rounded-full bg-warning" /> <span className="text-warning">محذوف</span></>
            ) : isBanned ? (
              <><ShieldAlert className="size-4 text-destructive" /> <span className="text-destructive">محظور</span></>
            ) : (
              <><ShieldCheck className="size-4 text-success" /> <span className="text-success">نشط</span></>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاريخ الانضمام",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.createdAt), 'yyyy-MM-dd')
        } catch {
          return "غير معروف"
        }
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user._id)}>
                نسخ معرف المستخدم
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.isBanned ? (
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: user._id, status: 'active' })}>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" /> فك الحظر
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-destructive" onClick={() => updateStatusMutation.mutate({ id: user._id, status: 'banned' })}>
                  <Ban className="mr-2 h-4 w-4" /> حظر المستخدم
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [updateStatusMutation]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة المستخدمين" 
        description="عرض وإدارة جميع الحسابات المسجلة في المنصة، والتحكم في الصلاحيات والحظر." 
      />
      {isLoading && users.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={users} 
          searchPlaceholder="ابحث باسم المستخدم أو المعرف..." 
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          manualFiltering
          searchValue={search}
          onSearchChange={setSearch}
          rowCount={totalCount}
        />
      )}
    </div>
  )
}
