import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, Edit, Trash, EyeOff, Eye, Loader2, Sparkles, Check, PackagePlus } from "lucide-react"
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
  DialogDescription,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_GIFT_PRESETS, GiftPreset } from "@/lib/gift-presets"
import { BRAND } from "@/config/brand"

export const Route = createFileRoute("/gifts")({
  head: () => ({
    meta: [{ title: `إدارة الهدايا | ${BRAND.shortArabicName}` }],
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
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkCurrentItem, setBulkCurrentItem] = useState("");
  
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<GiftPreset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<string | number>("");
  const formRef = useRef<HTMLFormElement>(null);

  const { data: gifts = [], isLoading } = useQuery({
    queryKey: ['admin_gifts'],
    queryFn: async () => {
      const res = await api.get('/gifts/admin')
      return res.data as Gift[]
    }
  });

  const existingNamesSet = useMemo(() => {
    return new Set(gifts.map(g => g.name.toLowerCase().trim()));
  }, [gifts]);

  const missingPresets = useMemo(() => {
    return DEFAULT_GIFT_PRESETS.filter(p => !existingNamesSet.has(p.name.toLowerCase().trim()));
  }, [existingNamesSet]);

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
        <div className="h-12 w-12 overflow-hidden rounded-lg bg-secondary/50 flex items-center justify-center p-1.5 border shadow-sm">
          <img src={row.original.imageUrl} alt={row.original.name} className="h-full w-full object-contain" />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "اسم الهدية (Name)",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-foreground block">{row.original.name}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">{row.original.description}</span>
          )}
        </div>
      ),
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
                setSelectedPreset(null);
                setFormName(gift.name);
                setFormPrice(gift.price);
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
        const fileEntry = formData.get('image') as File;
        if (fileEntry && fileEntry.size === 0) {
          formData.delete('image');
        }
        await api.patch(`/gifts/admin/${editingGift._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تم التعديل بنجاح");
      } else {
        // If a preset was selected and no custom file was chosen, fetch preset image as blob
        const fileEntry = formData.get('image') as File;
        if ((!fileEntry || fileEntry.size === 0) && selectedPreset) {
          const resp = await fetch(selectedPreset.image);
          const blob = await resp.blob();
          formData.set('image', blob, `${selectedPreset.id}.png`);
          if (!formData.get('description')) {
            formData.set('description', selectedPreset.description);
          }
        }
        await api.post(`/gifts/admin`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تمت إضافة الهدية بنجاح");
      }
      queryClient.invalidateQueries({ queryKey: ['admin_gifts'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (missingPresets.length === 0) {
      toast.info("جميع الهدايا موجودة بالفعل في قاعدة البيانات!");
      setIsBulkDialogOpen(false);
      return;
    }

    setIsBulkImporting(true);
    setBulkProgress(0);
    setBulkCurrentItem("");

    let successCount = 0;
    const total = missingPresets.length;
    let idx = 0;

    for (const preset of missingPresets) {
      idx++;
      setBulkCurrentItem(`${preset.name} (${idx} / ${total})`);
      setBulkProgress(Math.round((idx / total) * 100));

      try {
        const resp = await fetch(preset.image);
        const blob = await resp.blob();
        const formData = new FormData();
        formData.append('name', preset.name);
        formData.append('price', String(preset.price));
        formData.append('description', preset.description);
        formData.append('isActive', 'true');
        formData.append('image', blob, `${preset.id}.png`);

        await api.post('/gifts/admin', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to import ${preset.name}:`, err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['admin_gifts'] });
    setIsBulkImporting(false);
    setIsBulkDialogOpen(false);
    toast.success(`تم استيراد ${successCount} هدية بنجاح إلى قاعدة البيانات!`);
  };

  const handleOpenDialog = () => {
    setEditingGift(null);
    setSelectedPreset(null);
    setFormName("");
    setFormPrice("");
    setIsDialogOpen(true);
  };

  const handleSelectPreset = (preset: GiftPreset) => {
    setSelectedPreset(preset);
    setFormName(preset.name);
    setFormPrice(preset.price);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة الهدايا" 
        description="إضافة وتعديل الهدايا الافتراضية المتاحة للمستخدمين لإرسالها أثناء البثوث." 
        action={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              onClick={() => setIsBulkDialogOpen(true)}
            >
              <Sparkles className="mr-2 size-4 text-amber-500" /> 
              استيراد الحزمة الافتراضية (23 هدية 3D)
            </Button>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 size-4" /> إضافة هدية جديدة
            </Button>
          </div>
        }
      />

      {/* Bulk Import Confirmation Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={(open) => { if (!isBulkImporting) setIsBulkDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-amber-500" />
              استيراد حزمة الهدايا الافتراضية ثلاثية الأبعاد
            </DialogTitle>
            <DialogDescription>
              سيتم حفظ الهدايا مباشرة في قاعدة البيانات (MongoDB) ورفع الصور إلى التخزين السحابي بأسماء إنجليزية وأسعار قياسية معتمدة للبثوث المباشرة.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border text-sm">
              <div>
                <span className="font-semibold block">إجمالي هدايا الحزمة: {DEFAULT_GIFT_PRESETS.length}</span>
                <span className="text-muted-foreground text-xs">
                  {missingPresets.length > 0 
                    ? `سيتم استيراد ${missingPresets.length} هدية جديدة (تم تخطي ${DEFAULT_GIFT_PRESETS.length - missingPresets.length} موجودة مسبقاً)`
                    : "جميع الهدايا موجودة بالفعل في قاعدة البيانات!"}
                </span>
              </div>
              <Badge variant={missingPresets.length > 0 ? "default" : "secondary"}>
                {missingPresets.length} هدايا للإضافة
              </Badge>
            </div>

            {/* List preview */}
            <ScrollArea className="h-64 rounded-md border p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEFAULT_GIFT_PRESETS.map((p) => {
                  const isAlreadyAdded = existingNamesSet.has(p.name.toLowerCase().trim());
                  return (
                    <div 
                      key={p.id} 
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs ${
                        isAlreadyAdded ? "bg-muted/40 opacity-60" : "bg-card shadow-xs"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-md bg-secondary/60 flex items-center justify-center p-1 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{p.name}</p>
                        <p className="text-primary font-bold">{p.price.toLocaleString()} 🪙</p>
                      </div>
                      {isAlreadyAdded && (
                        <Check className="size-3.5 text-success shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Progress bar while importing */}
            {isBulkImporting && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>جاري الاستيراد: {bulkCurrentItem}</span>
                  <span>{bulkProgress}%</span>
                </div>
                <Progress value={bulkProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsBulkDialogOpen(false)} 
              disabled={isBulkImporting}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleBulkImport} 
              disabled={isBulkImporting || missingPresets.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isBulkImporting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <PackagePlus className="mr-2 size-4" />
                  بدء الاستيراد ({missingPresets.length} هدية)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Single Gift Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingGift ? "تعديل الهدية" : "إضافة هدية جديدة"}</DialogTitle>
            <DialogDescription>
              {editingGift ? "تعديل بيانات وسعر الهدية الحالية." : "يمكنك الاختيار من معرض القوالب ثلاثية الأبعاد الجاهزة، أو رفع صورة خاصة."}
            </DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-2">
            {!editingGift && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">اختيار سريع من القوالب ثلاثية الأبعاد (3D Presets):</Label>
                <ScrollArea className="h-32 rounded-lg border p-2 bg-muted/20">
                  <div className="grid grid-cols-4 gap-2">
                    {DEFAULT_GIFT_PRESETS.map((preset) => {
                      const isSelected = selectedPreset?.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected 
                              ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/40" 
                              : "hover:bg-secondary/70 border-border/60 bg-card"
                          }`}
                        >
                          <img src={preset.image} alt={preset.name} className="w-8 h-8 object-contain mb-1" />
                          <span className="text-[11px] font-semibold truncate w-full">{preset.name}</span>
                          <span className="text-[10px] text-primary font-bold">{preset.price} 🪙</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">اسم الهدية بالإنجليزية (Gift Name)</Label>
              <Input 
                id="name" 
                name="name" 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                required 
                placeholder="مثال: Royal Crown أو Supercar" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">السعر (عملة المنصة Coins)</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                min="1" 
                value={formPrice} 
                onChange={(e) => setFormPrice(e.target.value)} 
                required 
                placeholder="مثال: 1000" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة الهدية (PNG, SVG, GIF)</Label>
              {selectedPreset && !editingGift ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/30">
                  <img src={selectedPreset.image} alt={selectedPreset.name} className="w-10 h-10 object-contain" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selectedPreset.name} (قالب 3D مختار)</p>
                    <p className="text-xs text-muted-foreground">يمكنك استبدال الصورة برفع ملف من الأسفل إن أردت.</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedPreset(null)}>
                    إلغاء القالب
                  </Button>
                </div>
              ) : null}
              <Input 
                id="image" 
                name="image" 
                type="file" 
                accept="image/*" 
                required={!editingGift && !selectedPreset} 
              />
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

