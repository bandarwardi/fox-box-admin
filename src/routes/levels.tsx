import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, Edit, Trash, Loader2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useState, useMemo, useRef } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [{ title: "مستويات المستخدمين | ستريم برو" }],
  }),
  component: LevelsPage,
})

type Level = {
  _id: string
  level: number
  name: string
  minXP: number
  color: string
  badgeUrl?: string
}

function LevelsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['admin_levels'],
    queryFn: async () => {
      const res = await api.get('/levels/admin')
      return res.data as Level[]
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/levels/admin/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_levels'] })
      toast.success("تم حذف المستوى")
    },
    onError: () => toast.error("فشل الحذف")
  });

  const columns = useMemo<ColumnDef<Level>[]>(() => [
    {
      accessorKey: "level",
      header: "رقم المستوى",
      cell: ({ row }) => {
        const lvl = row.original
        return (
          <div className="flex items-center gap-2 font-bold">
            <span 
              className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm shrink-0"
              style={{ backgroundColor: lvl.color || '#94a3b8' }}
            >
              {lvl.level}
            </span>
            {lvl.badgeUrl && (
              <img src={lvl.badgeUrl} alt={lvl.name} className="h-6 w-6 object-contain" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: "اسم الرتبة",
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    {
      accessorKey: "minXP",
      header: "نقاط الخبرة (XP) المطلوبة",
      cell: ({ row }) => {
        const xp = row.original.minXP
        return <span className="font-mono font-medium">{xp.toLocaleString()} XP</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lvl = row.original
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
                setEditingLevel(lvl);
                setIsDialogOpen(true);
              }}>
                <Edit className="mr-2 h-4 w-4" /> تعديل المستوى
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => {
                if (window.confirm("هل أنت متأكد من حذف هذا المستوى؟")) {
                  deleteMutation.mutate(lvl._id);
                }
              }}>
                <Trash className="mr-2 h-4 w-4" /> حذف المستوى
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [deleteMutation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(formRef.current);
      if (editingLevel) {
        const fileEntry = formData.get('badge') as File;
        if (fileEntry && fileEntry.size === 0) {
          formData.delete('badge');
        }
        await api.patch(`/levels/admin/${editingLevel._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تم التعديل بنجاح");
      } else {
        await api.post(`/levels/admin`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تمت الإضافة بنجاح");
      }
      queryClient.invalidateQueries({ queryKey: ['admin_levels'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setEditingLevel(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="مستويات المستخدمين (Levels)" 
        description="إعداد مستويات ونقاط الخبرة المطلوبة (XP) لتطور المستخدمين والمذيعين." 
        action={
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 size-4" /> إضافة مستوى جديد
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLevel ? "تعديل المستوى" : "إضافة مستوى جديد"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">رقم المستوى</Label>
                <Input id="level" name="level" type="number" min="1" defaultValue={editingLevel?.level} required placeholder="مثال: 1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">اسم الرتبة</Label>
                <Input id="name" name="name" defaultValue={editingLevel?.name} required placeholder="مثال: مبتدئ" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minXP">نقاط الـ XP المطلوبة</Label>
                <Input id="minXP" name="minXP" type="number" min="0" defaultValue={editingLevel?.minXP} required placeholder="مثال: 500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">لون المستوى (Hex)</Label>
                <Input id="color" name="color" type="color" defaultValue={editingLevel?.color || "#94a3b8"} className="h-10 px-1 py-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">أيقونة/شارة الرتبة (اختياري)</Label>
              <Input id="badge" name="badge" type="file" accept="image/*" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLevel ? "حفظ التعديلات" : "إضافة المستوى"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل المستويات...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={levels} 
          searchKey="name" 
          searchPlaceholder="ابحث باسم الرتبة..." 
        />
      )}
    </div>
  )
}
