import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, MessageCircle, CheckCircle2, Clock, Send, Loader2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useState, useMemo, useRef, useEffect } from "react"
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
import { Avatar } from "@/components/admin/ui-kit"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BRAND } from "@/config/brand"

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [{ title: `تذاكر الدعم الفني | ${BRAND.shortArabicName}` }],
  }),
  component: SupportPage,
})

type TicketReply = {
  _id: string;
  senderId: { _id: string; displayName: string; role: string; avatarUrl?: string };
  message: string;
  createdAt: string;
}

type Ticket = {
  _id: string
  user: { _id: string, displayName: string, username: string, avatarUrl?: string }
  subject: string
  message: string
  status: "open" | "in_progress" | "closed"
  priority: "low" | "medium" | "high"
  replies: TicketReply[]
  createdAt: string
}

function SupportPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_tickets', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const res = await api.get('/tickets/admin', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        }
      })
      return res.data as { data: Ticket[], total: number }
    },
    refetchInterval: 15000
  });

  const tickets = data?.data || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // Auto-scroll to bottom of replies
  useEffect(() => {
    if (isSheetOpen && scrollRef.current) {
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    }
  }, [selectedTicket?.replies, isSheetOpen]);

  // Update ticket dynamically when viewing
  useEffect(() => {
    if (selectedTicket && isSheetOpen) {
      const updated = tickets.find(t => t._id === selectedTicket._id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets, selectedTicket, isSheetOpen]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await api.patch(`/tickets/admin/${id}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_tickets'] })
      toast.success("تم تحديث حالة التذكرة")
    },
    onError: () => toast.error("فشل التحديث")
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string, message: string }) => {
      await api.post(`/tickets/admin/${id}/reply`, { message })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_tickets'] })
      setReplyMessage("");
    },
    onError: () => toast.error("فشل إرسال الرد")
  });

  const columns = useMemo<ColumnDef<Ticket>[]>(() => [
    {
      accessorKey: "_id",
      header: "رقم التذكرة",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground" title={row.original._id}>#{row.original._id.slice(-6)}</span>,
    },
    {
      accessorKey: "user",
      header: "المستخدم",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.user?.avatarUrl ? (
            <img src={row.original.user.avatarUrl} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <Avatar name={row.original.user?.displayName || 'مستخدم'} hue={Math.floor(Math.random() * 360)} className="h-8 w-8" />
          )}
          <span className="font-bold">{row.original.user?.displayName || 'بدون اسم'}</span>
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "الموضوع",
      cell: ({ row }) => (
        <span className="font-medium max-w-[200px] truncate block" title={row.original.subject}>
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {status === "open" ? (
              <span className="flex items-center gap-1.5 text-destructive animate-pulse">
                <MessageCircle className="size-4" /> بانتظار الرد
              </span>
            ) : status === "in_progress" ? (
              <span className="flex items-center gap-1.5 text-warning">
                <Clock className="size-4" /> جاري الحل
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-4" /> مغلقة
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
        const ticket = row.original
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
                setSelectedTicket(ticket)
                setIsSheetOpen(true)
              }}>
                <MessageCircle className="mr-2 h-4 w-4" /> فتح ومراسلة
              </DropdownMenuItem>
              {ticket.status !== "closed" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-success" onClick={() => updateStatusMutation.mutate({ id: ticket._id, status: 'closed' })}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> إغلاق التذكرة
                  </DropdownMenuItem>
                </>
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
        title="تذاكر الدعم الفني" 
        description="استقبال وحل مشاكل واستفسارات المستخدمين والمذيعين." 
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col h-full gap-0 p-0">
          <div className="p-6 border-b">
            <SheetHeader>
              <SheetTitle>تذكرة الدعم: {selectedTicket?.subject}</SheetTitle>
            </SheetHeader>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-3">
                 <Avatar name={selectedTicket?.user?.displayName || 'U'} hue={100} className="h-10 w-10" />
                 <div>
                    <p className="font-bold">{selectedTicket?.user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{selectedTicket?.user?.username}</p>
                 </div>
              </div>
              {selectedTicket?.status !== 'closed' && (
                <Button variant="outline" size="sm" onClick={() => {
                  if (selectedTicket) updateStatusMutation.mutate({ id: selectedTicket._id, status: 'closed' })
                }}>
                   إغلاق التذكرة
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {/* Original Message */}
              <div className="flex flex-col gap-1 items-start">
                 <div className="bg-secondary p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-sm whitespace-pre-wrap">
                    {selectedTicket?.message}
                 </div>
                 <span className="text-xs text-muted-foreground mr-1">
                    {selectedTicket && format(new Date(selectedTicket.createdAt), 'yyyy-MM-dd HH:mm')}
                 </span>
              </div>

              {/* Replies */}
              {selectedTicket?.replies?.map((reply, i) => {
                 const isAdmin = reply.senderId.role === 'admin' || reply.senderId.role === 'superadmin' || reply.senderId._id !== selectedTicket.user._id;
                 return (
                   <div key={reply._id || i} className={`flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                     <div className={`p-3 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${isAdmin ? 'bg-primary text-primary-foreground rounded-tl-sm' : 'bg-secondary rounded-tr-sm'}`}>
                        {reply.message}
                     </div>
                     <span className="text-xs text-muted-foreground mx-1">
                        {format(new Date(reply.createdAt), 'MM-dd HH:mm')} - {reply.senderId.displayName}
                     </span>
                   </div>
                 )
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (replyMessage.trim() && selectedTicket) {
                  replyMutation.mutate({ id: selectedTicket._id, message: replyMessage })
                }
              }} 
              className="flex items-center gap-2"
            >
              <Input 
                placeholder={selectedTicket?.status === 'closed' ? "التذكرة مغلقة" : "اكتب ردك هنا..."}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={selectedTicket?.status === 'closed' || replyMutation.isPending}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!replyMessage.trim() || selectedTicket?.status === 'closed' || replyMutation.isPending}>
                {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {isLoading && tickets.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل التذاكر...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={tickets} 
          manualPagination
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  )
}
