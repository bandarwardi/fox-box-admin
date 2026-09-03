import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, Edit, Trash, EyeOff, Eye, Loader2 } from "lucide-react"
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

export const Route = createFileRoute("/gifts")({
  head: () => ({
    meta: [{ title: "إدارة الهدايا | ستريم برو" }],
  }),
  component: GiftsPage,
})

type Gift = {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl: string
  isActive: boolean
}

function GiftsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: gifts = [], isLoading } = useQuery({
    queryKey: ['admin_gifts'],
    queryFn: async () => {
      const res = await api.get('/gifts/admin')
      return res.data as Gift[]
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const formData = new FormData()
      formData.append('isActive', isActive.toString())
      await api.patch(`/gifts/admin/${id}`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_gifts'] })
      toast.success("تم تحديث حالة الهدية")
    },
    onError: () => toast.error("فشل التحديث")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gifts/admin/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_gifts'] })
      toast.success("تم حذف الهدية")
    },
    onError: () => toast.error("فشل الحذف")
  });

  const columns = useMemo<ColumnDef<Gift>[]>(() => [
    {
      accessorKey: "imageUrl",
      header: "أيقونة",
      cell: ({ row }) => (
        <div className="h-10 w-10 overflow-hidden rounded-md bg-secondary/50 flex items-center justify-center p-1 border">
          <img src={row.original.imageUrl} alt={row.original.name} className="h-full w-full object-contain" />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "اسم الهدية",
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    {
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.price.toLocaleString()} 🪙</span>,
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
          }`}>
            {isActive ? "مفعلة" : "معطلة"}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const gift = row.original
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
                setEditingGift(gift);
                setIsDialogOpen(true);
              }}>
                <Edit className="mr-2 h-4 w-4" /> تعديل السعر/الاسم
              </DropdownMenuItem>
              {gift.isActive ? (
                <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: gift._id, isActive: false })}>
                  <EyeOff className="mr-2 h-4 w-4" /> تعطيل الهدية
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-success" onClick={() => toggleStatusMutation.mutate({ id: gift._id, isActive: true })}>
                  <Eye className="mr-2 h-4 w-4" /> تفعيل الهدية
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => {
                if (window.confirm("هل أنت متأكد من حذف هذه الهدية نهائياً؟")) {
                  deleteMutation.mutate(gift._id);
                }
              }}>
                <Trash className="mr-2 h-4 w-4" /> حذف نهائي
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [toggleStatusMutation, deleteMutation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(formRef.current);
      if (editingGift) {
        // If editing and no new file is chosen, we should remove the empty file from formData to avoid errors,
        // but since we are using file input conditionally or not required on update, it's fine.
        const fileEntry = formData.get('image') as File;
        if (fileEntry && fileEntry.size === 0) {
          formData.delete('image');
        }
        await api.patch(`/gifts/admin/${editingGift._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تم التعديل بنجاح");
      } else {
        await api.post(`/gifts/admin`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تمت الإضافة بنجاح");
      }
      queryClient.invalidateQueries({ queryKey: ['admin_gifts'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setEditingGift(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة الهدايا" 
        description="إضافة وتعديل الهدايا الافتراضية المتاحة للمستخدمين لإرسالها أثناء البثوث." 
        action={
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 size-4" /> إضافة هدية جديدة
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGift ? "تعديل الهدية" : "إضافة هدية جديدة"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الهدية</Label>
              <Input id="name" name="name" defaultValue={editingGift?.name} required placeholder="مثال: وردة حمراء" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">السعر (عملة المنصة)</Label>
              <Input id="price" name="price" type="number" min="1" defaultValue={editingGift?.price} required placeholder="مثال: 10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">صورة الهدية (PNG, SVG, GIF)</Label>
              <Input id="image" name="image" type="file" accept="image/*" required={!editingGift} />
              {editingGift && (
                <p className="text-xs text-muted-foreground mt-1">اترك الحقل فارغاً إذا كنت لا تود تغيير الصورة الحالية.</p>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingGift ? "حفظ التعديلات" : "إضافة الهدية"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل الهدايا...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={gifts} 
          searchKey="name" 
          searchPlaceholder="ابحث باسم الهدية..." 
        />
      )}
    </div>
  )
}
