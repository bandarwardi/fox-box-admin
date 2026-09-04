import { createFileRoute } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash, 
  EyeOff, 
  Eye, 
  Loader2, 
  Sparkles, 
  Check, 
  PackagePlus, 
  Rocket, 
  MessageSquare, 
  Crown,
  Layers
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_STORE_PRESETS, StorePreset } from "@/lib/store-presets"

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [{ title: "متجر المنصة | ستريم برو" }],
  }),
  component: StorePage,
})

type StoreItem = {
  _id: string
  name: string
  description?: string
  type: string
  price: number
  durationDays: number
  imageUrl: string
  animationUrl?: string
  isActive: boolean
}

function StorePage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkCurrentItem, setBulkCurrentItem] = useState("");
  
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<StorePreset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [itemType, setItemType] = useState<string>("frame");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<string | number>("");
  const [formDuration, setFormDuration] = useState<string | number>(30);

  // Filter state: 'all' | 'entry_effect' | 'frame' | 'chat_bubble'
  const [filterType, setFilterType] = useState<string>("all");

  const { data: storeItems = [], isLoading } = useQuery({
    queryKey: ['admin_store'],
    queryFn: async () => {
      const res = await api.get('/store/admin')
      return res.data as StoreItem[]
    }
  });

  const counts = useMemo(() => {
    return {
      all: storeItems.length,
      entry_effect: storeItems.filter(i => i.type === 'entry_effect').length,
      frame: storeItems.filter(i => i.type === 'frame').length,
      chat_bubble: storeItems.filter(i => i.type === 'chat_bubble').length,
    }
  }, [storeItems]);

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return storeItems;
    return storeItems.filter(item => item.type === filterType);
  }, [storeItems, filterType]);

  const existingNamesSet = useMemo(() => {
    return new Set(storeItems.map(i => i.name.toLowerCase().trim()));
  }, [storeItems]);

  const missingPresets = useMemo(() => {
    return DEFAULT_STORE_PRESETS.filter(p => !existingNamesSet.has(p.name.toLowerCase().trim()));
  }, [existingNamesSet]);

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
      header: "الشكل والأنيميشن",
      cell: ({ row }) => (
        <div className="relative group h-12 w-12 overflow-hidden rounded-lg bg-secondary/50 flex items-center justify-center p-1 border shadow-xs">
          <img 
            src={row.original.animationUrl || row.original.imageUrl} 
            alt={row.original.name} 
            className="h-full w-full object-contain" 
            onError={(e) => {
              if (row.original.animationUrl && e.currentTarget.src !== row.original.imageUrl) {
                e.currentTarget.src = row.original.imageUrl;
              }
            }}
          />
          {row.original.animationUrl && (
            <span className="absolute bottom-0 right-0 bg-purple-600 text-[8px] text-white font-bold px-1 rounded-tl leading-tight">
              ANIM
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "اسم العنصر (Name)",
      cell: ({ row }) => (
        <div>
          <span className="font-bold block text-foreground">{row.original.name}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => {
        const type = row.original.type
        if (type === "entry_effect") {
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-semibold">
                <Rocket className="size-3" /> مؤثر دخول
              </span>
              {row.original.animationUrl && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-400 px-2 py-0.5 text-[10px] font-bold">
                  <Sparkles className="size-2.5 text-purple-400" /> متحرك
                </span>
              )}
            </div>
          )
        }
        if (type === "frame") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 px-2.5 py-0.5 text-xs font-semibold">
              <Crown className="size-3" /> إطار صورة
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 text-xs font-semibold">
            <MessageSquare className="size-3" /> فقاعة دردشة
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
                setSelectedPreset(null);
                setFormName(item.name);
                setFormPrice(item.price);
                setFormDuration(item.durationDays);
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
      formData.set('type', itemType);

      if (editingItem) {
        const fileEntry = formData.get('image') as File;
        if (fileEntry && fileEntry.size === 0) {
          formData.delete('image');
        }
        const animEntry = formData.get('animation') as File;
        if (animEntry && animEntry.size === 0) {
          formData.delete('animation');
        }
        await api.patch(`/store/admin/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تم التعديل بنجاح");
      } else {
        const fileEntry = formData.get('image') as File;
        if ((!fileEntry || fileEntry.size === 0) && selectedPreset) {
          const resp = await fetch(selectedPreset.image);
          const blob = await resp.blob();
          const ext = selectedPreset.image.endsWith('.svg') ? 'svg' : 'png';
          formData.set('image', blob, `${selectedPreset.id}.${ext}`);
          if (!formData.get('description')) {
            formData.set('description', selectedPreset.description);
          }
          if (selectedPreset.animation) {
            const animEntry = formData.get('animation') as File;
            if (!animEntry || animEntry.size === 0) {
              try {
                const animResp = await fetch(selectedPreset.animation);
                const animBlob = await animResp.blob();
                formData.set('animation', animBlob, `${selectedPreset.id}.webp`);
              } catch (err) {
                console.warn("Could not load preset animation", err);
              }
            }
          }
        }
        await api.post(`/store/admin`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("تمت إضافة العنصر بنجاح");
      }
      queryClient.invalidateQueries({ queryKey: ['admin_store'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (missingPresets.length === 0) {
      toast.info("جميع عناصر المتجر موجودة بالفعل في قاعدة البيانات!");
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
        const ext = preset.image.endsWith('.svg') ? 'svg' : 'png';
        const formData = new FormData();
        formData.append('name', preset.name);
        formData.append('price', String(preset.price));
        formData.append('durationDays', String(preset.durationDays));
        formData.append('type', preset.type);
        formData.append('description', preset.description);
        formData.append('image', blob, `${preset.id}.${ext}`);

        if (preset.animation) {
          try {
            const animResp = await fetch(preset.animation);
            const animBlob = await animResp.blob();
            formData.append('animation', animBlob, `${preset.id}.webp`);
          } catch (err) {
            console.warn(`Could not attach animation for ${preset.name}`, err);
          }
        }

        await api.post('/store/admin', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to import ${preset.name}:`, err.response?.data || err.message);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['admin_store'] });
    setIsBulkImporting(false);
    setIsBulkDialogOpen(false);
    toast.success(`تم استيراد ${successCount} عنصر متجر بنجاح!`);
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    setItemType("frame");
    setSelectedPreset(null);
    setFormName("");
    setFormPrice("");
    setFormDuration(30);
    setIsDialogOpen(true);
  };

  const handleSelectPreset = (preset: StorePreset) => {
    setSelectedPreset(preset);
    setItemType(preset.type);
    setFormName(preset.name);
    setFormPrice(preset.price);
    setFormDuration(preset.durationDays);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="متجر المنصة" 
        description="إدارة عناصر المتجر مثل إطارات الصور ومؤثرات الدخول التي يمكن للمستخدمين شراؤها." 
        action={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              onClick={() => setIsBulkDialogOpen(true)}
            >
              <Sparkles className="mr-2 size-4 text-amber-500" /> 
              استيراد الحزمة الافتراضية (17 عنصر)
            </Button>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 size-4" /> إضافة عنصر جديد
            </Button>
          </div>
        }
      />

      {/* Filter Tabs by Item Type */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl border bg-card/60 backdrop-blur-xs">
        <Button 
          variant={filterType === 'all' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilterType('all')}
          className="rounded-lg text-xs gap-1.5"
        >
          <Layers className="size-3.5" />
          الكل
          <Badge variant={filterType === 'all' ? 'secondary' : 'outline'} className="mr-1 text-[11px] px-1.5 py-0 h-4">
            {counts.all}
          </Badge>
        </Button>

        <Button 
          variant={filterType === 'entry_effect' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilterType('entry_effect')}
          className="rounded-lg text-xs gap-1.5"
        >
          <Rocket className="size-3.5 text-amber-500" />
          مؤثرات الدخول
          <Badge variant={filterType === 'entry_effect' ? 'secondary' : 'outline'} className="mr-1 text-[11px] px-1.5 py-0 h-4">
            {counts.entry_effect}
          </Badge>
        </Button>

        <Button 
          variant={filterType === 'frame' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilterType('frame')}
          className="rounded-lg text-xs gap-1.5"
        >
          <Crown className="size-3.5 text-cyan-500" />
          إطارات الصور
          <Badge variant={filterType === 'frame' ? 'secondary' : 'outline'} className="mr-1 text-[11px] px-1.5 py-0 h-4">
            {counts.frame}
          </Badge>
        </Button>

        <Button 
          variant={filterType === 'chat_bubble' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setFilterType('chat_bubble')}
          className="rounded-lg text-xs gap-1.5"
        >
          <MessageSquare className="size-3.5 text-purple-500" />
          فقاعات الدردشة
          <Badge variant={filterType === 'chat_bubble' ? 'secondary' : 'outline'} className="mr-1 text-[11px] px-1.5 py-0 h-4">
            {counts.chat_bubble}
          </Badge>
        </Button>
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={(open) => { if (!isBulkImporting) setIsBulkDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-amber-500" />
              استيراد حزمة عناصر المتجر الافتراضية
            </DialogTitle>
            <DialogDescription>
              سيتم إضافة 17 عنصراً من الإطارات الفاخرة، مؤثرات الدخول ثلاثية الأبعاد، وفقاعات الدردشة المميزة وحفظها في قاعدة البيانات.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border text-sm">
              <div>
                <span className="font-semibold block">إجمالي عناصر الحزمة: {DEFAULT_STORE_PRESETS.length}</span>
                <span className="text-muted-foreground text-xs">
                  {missingPresets.length > 0 
                    ? `سيتم استيراد ${missingPresets.length} عنصر جديد (تم تخطي ${DEFAULT_STORE_PRESETS.length - missingPresets.length} موجودة مسبقاً)`
                    : "جميع عناصر المتجر موجودة بالفعل في قاعدة البيانات!"}
                </span>
              </div>
              <Badge variant={missingPresets.length > 0 ? "default" : "secondary"}>
                {missingPresets.length} عناصر للإضافة
              </Badge>
            </div>

            {/* List preview */}
            <ScrollArea className="h-64 rounded-md border p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEFAULT_STORE_PRESETS.map((p) => {
                  const isAlreadyAdded = existingNamesSet.has(p.name.toLowerCase().trim());
                  return (
                    <div 
                      key={p.id} 
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs ${
                        isAlreadyAdded ? "bg-muted/40 opacity-60" : "bg-card shadow-xs"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-md bg-secondary/60 flex items-center justify-center p-1 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{p.name}</p>
                        <p className="text-primary font-bold">{p.price.toLocaleString()} 🪙</p>
                        <span className="text-[10px] text-muted-foreground">
                          {p.type === 'frame' ? 'إطار' : p.type === 'entry_effect' ? 'دخول' : 'فقاعة'}
                        </span>
                      </div>
                      {isAlreadyAdded && (
                        <Check className="size-3.5 text-success shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

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
                  بدء الاستيراد ({missingPresets.length} عنصر)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Single Store Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "تعديل العنصر" : "إضافة عنصر جديد"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "تعديل بيانات وسعر العنصر الحالي." : "يمكنك الاختيار من معرض القوالب الجاهزة أو إدخال بيانات مخصصة."}
            </DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-2">
            {!editingItem && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">اختيار سريع من قوالب المتجر الجاهزة:</Label>
                <ScrollArea className="h-32 rounded-lg border p-2 bg-muted/20">
                  <div className="grid grid-cols-4 gap-2">
                    {DEFAULT_STORE_PRESETS.map((preset) => {
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
              <Label htmlFor="name">اسم العنصر بالإنجليزية (Item Name)</Label>
              <Input 
                id="name" 
                name="name" 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                required 
                placeholder="مثال: Royal Gold Frame أو Supercar VIP Entry" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>نوع العنصر</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="frame">إطار صورة (Frame)</SelectItem>
                  <SelectItem value="entry_effect">مؤثر دخول (Entry Effect)</SelectItem>
                  <SelectItem value="chat_bubble">فقاعة دردشة (Chat Bubble)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="مثال: 1500" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationDays">المدة (أيام Days)</Label>
                <Input 
                  id="durationDays" 
                  name="durationDays" 
                  type="number" 
                  min="1" 
                  value={formDuration} 
                  onChange={(e) => setFormDuration(e.target.value)} 
                  required 
                  placeholder="مثال: 30" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة أو تصميم العنصر (SVG, PNG)</Label>
              {selectedPreset && !editingItem ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/30">
                  <img src={selectedPreset.image} alt={selectedPreset.name} className="w-10 h-10 object-contain" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selectedPreset.name} (قالب مختار)</p>
                    <p className="text-xs text-muted-foreground">يمكنك استبدال التصميم برفع ملفك الخاص أدناه إن رغبت.</p>
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
                required={!editingItem && !selectedPreset} 
              />
              {editingItem && (
                <p className="text-xs text-muted-foreground mt-1">اترك الحقل فارغاً إذا كنت لا تود تغيير الصورة.</p>
              )}
            </div>

            {itemType === 'entry_effect' && (
              <div className="space-y-2 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="animation" className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-semibold text-xs">
                    <Sparkles className="size-3.5 text-purple-500" />
                    ملف الأنيميشن المتحرك (Animated WebP / GIF)
                  </Label>
                  {selectedPreset?.animation && (
                    <Badge variant="secondary" className="text-[10px]">أنيميشن متوفر</Badge>
                  )}
                </div>

                {selectedPreset?.animation && !editingItem && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 border text-xs">
                    <div className="w-12 h-12 rounded bg-background/90 flex items-center justify-center p-1 border">
                      <img src={selectedPreset.animation} alt="animation preview" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">معاينة أنيميشن القالب</p>
                      <p className="text-muted-foreground text-[11px]">سيتم رفع وحفظ ملف الأنيميشن في S3 تلقائياً.</p>
                    </div>
                  </div>
                )}

                <Input 
                  id="animation" 
                  name="animation" 
                  type="file" 
                  accept="image/webp,image/gif,.svga,.json" 
                />
                <p className="text-[11px] text-muted-foreground">
                  (اختياري) اختر ملف أنيميشن مفرغ خاص، أو اتركه فارغاً لاعتماد أنيميشن القالب.
                </p>
              </div>
            )}

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
          data={filteredItems} 
          searchKey="name" 
          searchPlaceholder="ابحث باسم العنصر..." 
        />
      )}
    </div>
  )
}

