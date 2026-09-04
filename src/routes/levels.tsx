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
  emoji?: string
  minXP: number
  maxXP?: number
  color: string
  badgeUrl?: string
  rewardCoins?: number
  rewardDiamonds?: number
  rewardStoreItem?: string
  perks?: string[]
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
      header: "المستوى والشارة",
      cell: ({ row }) => {
        const lvl = row.original
        return (
          <div className="flex items-center gap-3">
            <span 
              className="flex h-8 w-8 items-center justify-center rounded-full text-white font-black text-sm shadow-md shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: lvl.color || '#94a3b8' }}
            >
              {lvl.level}
            </span>
            <div className="relative flex items-center justify-center h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border shadow-sm shrink-0">
              {lvl.badgeUrl ? (
                <img 
                  src={lvl.badgeUrl} 
                  alt={lvl.name} 
                  className="h-8 w-8 object-contain drop-shadow-sm" 
                  onError={(e) => {
                    // Fallback to local asset if remote proxy is pending
                    const target = e.currentTarget;
                    if (!target.dataset['triedLocal']) {
                      target.dataset['triedLocal'] = "true";
                      target.src = `/assets/levels/level_${lvl.level}.png`;
                    }
                  }}
                />
              ) : (
                <span className="text-xl">{lvl.emoji || '⭐'}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: "اسم الرتبة والامتيازات",
      cell: ({ row }) => {
        const lvl = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base">{lvl.emoji}</span>
              <span>{lvl.name}</span>
            </div>
            {lvl.perks && lvl.perks.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lvl.perks.slice(0, 2).map((perk, i) => (
                  <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-muted-foreground border">
                    {perk}
                  </span>
                ))}
                {lvl.perks.length > 2 && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{lvl.perks.length - 2} المزيد
                  </span>
                )}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "minXP",
      header: "نقاط الخبرة (XP)",
      cell: ({ row }) => {
        const lvl = row.original
        const maxText = lvl.maxXP && lvl.maxXP < 999999999 ? lvl.maxXP.toLocaleString() : '∞';
        return (
          <div className="font-mono text-xs space-y-0.5">
            <div className="font-semibold text-primary">
              {lvl.minXP.toLocaleString()} XP
            </div>
            <div className="text-[11px] text-muted-foreground">
              إلى {maxText} XP
            </div>
          </div>
        )
      },
    },
    {
      id: "rewards",
      header: "مكافآت الترقية",
      cell: ({ row }) => {
        const lvl = row.original
        const hasRewards = (lvl.rewardCoins || 0) > 0 || (lvl.rewardDiamonds || 0) > 0 || !!lvl.rewardStoreItem
        if (!hasRewards) {
          return <span className="text-xs text-muted-foreground">-</span>
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {lvl.rewardCoins ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                🪙 {lvl.rewardCoins.toLocaleString()}
              </span>
            ) : null}
            {lvl.rewardDiamonds ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50">
                💎 {lvl.rewardDiamonds.toLocaleString()}
              </span>
            ) : null}
            {lvl.rewardStoreItem ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                🎁 {lvl.rewardStoreItem}
              </span>
            ) : null}
          </div>
        )
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
        title="مستويات المستخدمين (Levels System)" 
        description="إدارة هيكل الـ 30 مستوى ونقاط الـ XP ومكافآت الترقية (عملات، ألماس، عناصر المتجر)." 
        action={
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 size-4" /> إضافة مستوى جديد
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLevel ? `تعديل المستوى ${editingLevel.level}` : "إضافة مستوى جديد"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="level">رقم المستوى</Label>
                <Input id="level" name="level" type="number" min="1" defaultValue={editingLevel?.level} required placeholder="مثال: 1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emoji">الرمز التعبيري</Label>
                <Input id="emoji" name="emoji" defaultValue={editingLevel?.emoji || '⭐'} placeholder="مثال: 🌱" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="color">لون المستوى</Label>
                <Input id="color" name="color" type="color" defaultValue={editingLevel?.color || "#94a3b8"} className="h-10 px-1 py-1" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">اسم الرتبة</Label>
              <Input id="name" name="name" defaultValue={editingLevel?.name} required placeholder="مثال: Seedling | بذرة" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="minXP">نقاط XP البداية</Label>
                <Input id="minXP" name="minXP" type="number" min="0" defaultValue={editingLevel?.minXP} required placeholder="مثال: 1000" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxXP">نقاط XP النهاية</Label>
                <Input id="maxXP" name="maxXP" type="number" min="0" defaultValue={editingLevel?.maxXP} placeholder="مثال: 1999" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rewardCoins">مكافأة العملات 🪙</Label>
                <Input id="rewardCoins" name="rewardCoins" type="number" min="0" defaultValue={editingLevel?.rewardCoins || 0} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rewardDiamonds">مكافأة الألماس 💎</Label>
                <Input id="rewardDiamonds" name="rewardDiamonds" type="number" min="0" defaultValue={editingLevel?.rewardDiamonds || 0} placeholder="0" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="rewardStoreItem">عنصر المتجر المجاني عند الفتح 🎁</Label>
              <Input id="rewardStoreItem" name="rewardStoreItem" defaultValue={editingLevel?.rewardStoreItem || ''} placeholder="مثال: Sakura Blossom Frame" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="badge">أيقونة الشارة ثلاثية الأبعاد (3D Badge)</Label>
              <Input id="badge" name="badge" type="file" accept="image/*" />
            </div>

            <DialogFooter className="pt-3">
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

