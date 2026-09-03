import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Radio, VideoOff, Eye, Ban, Tv2 } from "lucide-react"
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
import { LiveStreamPlayerDialog } from "@/components/admin/live-stream-player-dialog"

export const Route = createFileRoute("/streams")({
  head: () => ({
    meta: [{ title: "إدارة البثوث | ستريم برو" }],
  }),
  component: StreamsPage,
})

type RealStream = {
  _id: string
  title: string
  broadcaster: {
    _id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
  status: string
  isLive: boolean
  viewerCount: number
  startedAt: string
}

function StreamsPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [selectedStreamForWatch, setSelectedStreamForWatch] = useState<RealStream | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_streams', pagination.pageIndex, pagination.pageSize, search],
    queryFn: async () => {
      const res = await api.get('/broadcasts/admin/all', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: search || undefined
        }
      })
      return res.data as { data: RealStream[], total: number }
    },
    refetchInterval: 10000 // auto refresh every 10s
  });

  const streams = data?.data || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const endStreamMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/broadcasts/admin/${id}/end`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_streams'] })
      toast.success("تم إنهاء البث إجبارياً")
    },
    onError: () => {
      toast.error("فشل في إنهاء البث")
    }
  });

  const columns = useMemo<ColumnDef<RealStream>[]>(() => [
    {
      accessorKey: "broadcaster",
      header: "المذيع",
      cell: ({ row }) => {
        const streamer = row.original.broadcaster
        return (
          <div className="flex items-center gap-3">
            {streamer?.avatarUrl ? (
              <img src={streamer.avatarUrl} alt={streamer.displayName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Avatar name={streamer?.displayName || streamer?.username || 'غير معروف'} hue={Math.floor(Math.random() * 360)} />
            )}
            <span className="font-bold">{streamer?.displayName || streamer?.username || 'بدون اسم'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "title",
      header: "عنوان البث",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium" title={row.original.title}>
          {row.original.title || 'بدون عنوان'}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const stream = row.original
        return (
          <div className="flex items-center gap-1.5 font-bold">
            {stream.isLive ? (
              <span className="flex items-center gap-1.5 text-destructive animate-pulse">
                <Radio className="size-4" /> مباشر
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <VideoOff className="size-4" /> منتهي
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "viewerCount",
      header: "المشاهدات",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Eye className="size-4" />
          <span>{row.original.viewerCount || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "startedAt",
      header: "وقت البدء",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.startedAt), "yyyy-MM-dd HH:mm")
        } catch {
          return "غير معروف"
        }
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const stream = row.original
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(stream._id)}>
                نسخ معرف البث
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!stream.isLive) {
                    toast.info("هذا البث منتهي بالفعل ولا يمكن مشاهدته");
                    return;
                  }
                  setSelectedStreamForWatch(stream);
                }}
              >
                <Tv2 className="mr-2 h-4 w-4" /> مشاهدة البث
              </DropdownMenuItem>
              {stream.isLive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => endStreamMutation.mutate(stream._id)}>
                    <Ban className="mr-2 h-4 w-4" /> إنهاء البث إجبارياً
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [endStreamMutation]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة البثوث" 
        description="مراقبة البثوث المباشرة الحالية، والإطلاع على سجل البثوث السابقة، والتدخل في حال وجود مخالفات." 
      />
      {isLoading && streams.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={streams} 
          searchPlaceholder="ابحث بعنوان البث..." 
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

      <LiveStreamPlayerDialog
        open={!!selectedStreamForWatch}
        onOpenChange={(open) => {
          if (!open) setSelectedStreamForWatch(null);
        }}
        streamId={selectedStreamForWatch?._id || null}
        streamTitle={selectedStreamForWatch?.title}
        broadcasterName={
          selectedStreamForWatch?.broadcaster?.displayName ||
          selectedStreamForWatch?.broadcaster?.username
        }
        broadcasterAvatar={selectedStreamForWatch?.broadcaster?.avatarUrl}
        onStreamEnded={() => {
          queryClient.invalidateQueries({ queryKey: ["admin_streams"] });
        }}
      />
    </div>
  )
}
