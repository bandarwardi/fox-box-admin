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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [{ title: "متجر المنصة | ستريم برو" }],
  }),
  component: StorePage,
})

type StoreItem = {
  _id: string
  name: string
  type: string
  price: number
  durationDays: number
  imageUrl: string
  isActive: boolean
}

function StorePage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [itemType, setItemType] = useState<string>("frame");

  const { data: storeItems = [], isLoading } = useQuery({
    queryKey: ['admin_store'],
    queryFn: async () => {
      const res = await api.get('/store/admin')
      return res.data as StoreItem[]
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const formData = new FormData()
      formData.append('isActive', isActive.toString())
      await api.patch(`/store/admin/${id}`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_store'] })
      toast.success("تم تحديث حالة العنصر")
    },
    onError: () => toast.error("فشل التحديث")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/store/admin/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_store'] })
      toast.success("تم حذف العنصر")
    },
    onError: () => toast.error("فشل الحذف")
  });

  const columns = useMemo<ColumnDef<StoreItem>[]>(() => [
    {
      accessorKey: "imageUrl",
      header: "الشكل",
      cell: ({ row }) => (
        <div className="h-10 w-10 overflow-hidden rounded-md bg-secondary/50 flex items-center justify-center p-1 border">
          <img src={row.original.imageUrl} alt={row.original.name} className="h-full w-full object-contain" />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "اسم العنصر",
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
            {type === "frame" ? "إطار صورة" : type === "chat_bubble" ? "فقاعة دردشة" : "مؤثرات دخول"}
          </span>
        )
      },
    },
    {
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.price.toLocaleString()} 🪙</span>,
    },
    {
      accessorKey: "durationDays",
      header: "المدة",
      cell: ({ row }) => <span>{row.original.durationDays} يوم</span>,
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
            {isActive ? "مفعل" : "معطل"}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original
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
                setEditingItem(item);
                setItemType(item.type);
                setIsDialogOpen(true);
              }}>
                <Edit className="mr-2 h-4 w-4" /> تعديل العنصر
              </DropdownMenuItem>
              {item.isActive ? (
                <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: item._id, isActive: false })}>
                  <EyeOff className="mr-2 h-4 w-4" /> تعطيل العنصر
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-success" onClick={() => toggleStatusMutation.mutate({ id: item._id, isActive: true })}>
                  <Eye className="mr-2 h-4 w-4" /> تفعيل العنصر
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => {
                if (window.confirm("هل أنت متأكد من حذف هذا العنصر نهائياً؟")) {
                  deleteMutation.mutate(item._id);
                }
              }}>
                <Trash className="mr-2 h-4 w-4" /> حذف العنصر
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
      formData.set('type', itemType); // Add select value manually

      if (editingItem) {
        const fileEntry = formData.get('image') as File;
        if (fileEntry && fileEntry.size === 0) {
          formData.delete('image');
        }
        await api.patch(`/store/admin/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تم التعديل بنجاح");
      } else {
        await api.post(`/store/admin`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تمت الإضافة بنجاح");
      }
      queryClient.invalidateQueries({ queryKey: ['admin_store'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    setItemType("frame");
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="متجر المنصة" 
        description="إدارة عناصر المتجر مثل إطارات الصور ومؤثرات الدخول التي يمكن للمستخدمين شراؤها." 
        action={
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 size-4" /> إضافة عنصر جديد
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "تعديل العنصر" : "إضافة عنصر جديد"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العنصر</Label>
              <Input id="name" name="name" defaultValue={editingItem?.name} required placeholder="مثال: إطار ملكي" />
            </div>
            
            <div className="space-y-2">
              <Label>نوع العنصر</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="frame">إطار صورة</SelectItem>
                  <SelectItem value="entry_effect">مؤثر دخول</SelectItem>
                  <SelectItem value="chat_bubble">فقاعة دردشة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">السعر (عملة المنصة)</Label>
                <Input id="price" name="price" type="number" min="1" defaultValue={editingItem?.price} required placeholder="مثال: 500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationDays">المدة (أيام)</Label>
                <Input id="durationDays" name="durationDays" type="number" min="1" defaultValue={editingItem?.durationDays} required placeholder="مثال: 30" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة العنصر (PNG, GIF)</Label>
              <Input id="image" name="image" type="file" accept="image/*" required={!editingItem} />
              {editingItem && (
                <p className="text-xs text-muted-foreground mt-1">اترك الحقل فارغاً إذا كنت لا تود تغيير الصورة.</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "حفظ التعديلات" : "إضافة العنصر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">جاري تحميل عناصر المتجر...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={storeItems} 
          searchKey="name" 
          searchPlaceholder="ابحث باسم العنصر..." 
        />
      )}
    </div>
  )
}
