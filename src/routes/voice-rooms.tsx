import { createFileRoute } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Mic, Eye, Ban, Sparkles, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState, useMemo } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/admin/ui-kit";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/voice-rooms")({
  head: () => ({
    meta: [{ title: `إدارة الغرف الصوتية | ${BRAND.shortArabicName}` }],
  }),
  component: VoiceRoomsPage,
});

type RealVoiceRoom = {
  _id: string;
  title: string;
  host: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  category: string;
  maxSeats: number;
  seats: Array<{
    index: number;
    userId: string | null;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
    isMuted: boolean;
    isLocked: boolean;
  }>;
  status: string;
  isLive: boolean;
  viewerCount: number;
  totalGiftsReceived: number;
  startedAt: string;
};

function VoiceRoomsPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ['admin_voice_rooms', pagination.pageIndex, pagination.pageSize, statusFilter],
    queryFn: async () => {
      const res = await api.get('/voice-rooms/admin/all', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      return res.data as { data: RealVoiceRoom[]; total: number };
    },
    refetchInterval: 10000,
  });

  const rooms = data?.data || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const forceEndMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/voice-rooms/admin/${id}/force-end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_voice_rooms'] });
      toast.success("تم إنهاء الغرفة الصوتية بنجاح");
    },
    onError: () => {
      toast.error("فشل في إنهاء الغرفة الصوتية");
    },
  });

  const columns = useMemo<ColumnDef<RealVoiceRoom>[]>(
    () => [
      {
        accessorKey: "host",
        header: "المضيف",
        cell: ({ row }) => {
          const host = row.original.host;
          return (
            <div className="flex items-center gap-3">
              {host?.avatarUrl ? (
                <img
                  src={host.avatarUrl}
                  alt={host.displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <Avatar
                  name={host?.displayName || host?.username || 'غير معروف'}
                  hue={Math.floor(Math.random() * 360)}
                />
              )}
              <div className="flex flex-col">
                <span className="font-bold">{host?.displayName || host?.username || 'بدون اسم'}</span>
                <span className="text-xs text-muted-foreground">@{host?.username}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "عنوان الغرفة",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">{row.original.category}</span>
          </div>
        ),
      },
      {
        accessorKey: "seats",
        header: "المقاعد المشغولة",
        cell: ({ row }) => {
          const seats = row.original.seats || [];
          const occupied = seats.filter((s) => !!s.userId).length;
          const max = row.original.maxSeats || 8;
          return (
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{occupied} / {max} مقعد</span>
            </div>
          );
        },
      },
      {
        accessorKey: "viewerCount",
        header: "المستمعون",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-bold">
            <Eye className="h-4 w-4 text-sky-500" />
            <span>{row.original.viewerCount || 0}</span>
          </div>
        ),
      },
      {
        accessorKey: "totalGiftsReceived",
        header: "إجمالي الهدايا",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-bold text-amber-500">
            <Sparkles className="h-4 w-4" />
            <span>{(row.original.totalGiftsReceived || 0).toLocaleString()} 💎</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const isLive = row.original.isLive && row.original.status === 'live';
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isLive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              {isLive ? "نشطة الآن" : "منتهية"}
            </span>
          );
        },
      },
      {
        accessorKey: "startedAt",
        header: "وقت البدء",
        cell: ({ row }) => {
          try {
            return (
              <span className="text-xs text-muted-foreground">
                {format(new Date(row.original.startedAt), "yyyy-MM-dd HH:mm")}
              </span>
            );
          } catch {
            return "-";
          }
        },
      },
      {
        id: "actions",
        header: "الإجراءات",
        cell: ({ row }) => {
          const room = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-right">
                <DropdownMenuLabel>إجراءات الغرفة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {room.isLive && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من إنهاء الغرفة "${room.title}" إجبارياً؟`)) {
                        forceEndMutation.mutate(room._id);
                      }
                    }}
                  >
                    <span>إنهاء الغرفة</span>
                    <Ban className="h-4 w-4" />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [forceEndMutation],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="الغرف الصوتية متعددة المقاعد"
        description="متابعة وإدارة غرف الحوار الصوتي المباشرة والتحكم في حالتها إدارياً"
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'live', label: 'النشطة الآن 🔴' },
          { id: 'ended', label: 'المنتهية' },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={statusFilter === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(tab.id)}
            className="rounded-xl"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border bg-card p-3 sm:p-4 shadow-sm overflow-hidden min-w-0">
        {isLoading && rooms.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rooms}
            manualPagination
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            rowCount={totalCount}
          />
        )}
      </div>
    </div>
  );
}
