import { createFileRoute } from "@tanstack/react-router"
import { Save, Loader2, Plus, Trash2, Sparkles, Gem, Coins } from "lucide-react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { BRAND } from "@/config/brand"

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: `إعدادات التطبيق | ${BRAND.shortArabicName}` }],
  }),
  component: SettingsPage,
})

type Setting = {
  key: string
  value: any
}

type CoinPackage = {
  id: string
  coins: string
  price: string
  popular?: boolean
  badge?: string | null
}

const DEFAULT_PACKAGES: CoinPackage[] = [
  { id: 'pkg_1', coins: '100', price: '$1.99', popular: false, badge: null },
  { id: 'pkg_2', coins: '500', price: '$7.99', popular: true, badge: 'Best Value' },
  { id: 'pkg_3', coins: '1,200', price: '$14.99', popular: false, badge: 'Popular' },
  { id: 'pkg_4', coins: '2,500', price: '$28.99', popular: false, badge: 'VIP Choice' },
  { id: 'pkg_5', coins: '5,000', price: '$54.99', popular: false, badge: 'Mega Saver' },
  { id: 'pkg_6', coins: '10,000', price: '$99.99', popular: false, badge: 'Ultimate VIP' },
]

function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({
    app_name: BRAND.arabicName,
    support_email: BRAND.supportEmail,
    maintenance_mode: false,
    app_fee_percentage: 30,
    coin_exchange_rate: 100,
    diamond_exchange_rate: 10,
    coin_packages: DEFAULT_PACKAGES,
    terms_of_use: "يجب على جميع المستخدمين الالتزام...",
    privacy_policy: "نحن نحترم خصوصيتك...",
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin_settings'],
    queryFn: async () => {
      const res = await api.get('/settings/admin')
      return res.data as Setting[]
    }
  });

  useEffect(() => {
    if (settings.length > 0) {
      const newForm = { ...formData };
      settings.forEach(s => {
        newForm[s.key] = s.value;
      });
      // Ensure coin_packages is an array if returned from backend
      if (!Array.isArray(newForm['coin_packages'])) {
        newForm['coin_packages'] = DEFAULT_PACKAGES;
      }
      setFormData(newForm);
    }
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handlePackageChange = (index: number, field: keyof CoinPackage, value: any) => {
    const pkgs = [...(formData['coin_packages'] || [])];
    if (pkgs[index]) {
      pkgs[index] = { ...pkgs[index], [field]: value };
      setFormData(prev => ({ ...prev, coin_packages: pkgs }));
    }
  };

  const handleAddPackage = () => {
    const pkgs = [...(formData['coin_packages'] || [])];
    pkgs.push({
      id: `pkg_${Date.now()}`,
      coins: '1000',
      price: '$9.99',
      popular: false,
      badge: null,
    });
    setFormData(prev => ({ ...prev, coin_packages: pkgs }));
  };

  const handleRemovePackage = (index: number) => {
    const pkgs = [...(formData['coin_packages'] || [])];
    pkgs.splice(index, 1);
    setFormData(prev => ({ ...prev, coin_packages: pkgs }));
  };

  const saveMutation = useMutation({
    mutationFn: async (keysToSave: string[]) => {
      for (const key of keysToSave) {
        try {
          await api.patch(`/settings/admin/${key}`, { value: formData[key] });
        } catch (err: any) {
          if (err.response?.status === 404) {
            // Setting doesn't exist yet, create it
            await api.post(`/settings/admin`, { key, value: formData[key], description: 'System setting' });
          } else {
            throw err;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ الإعدادات")
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إعدادات التطبيق" 
        description="تكوين الإعدادات العامة للمنصة، نسب الأرباح، وشروط الاستخدام." 
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 flex w-full flex-wrap sm:inline-flex sm:w-auto h-auto p-1 gap-1 bg-muted/60">
          <TabsTrigger value="general" className="flex-1 sm:flex-initial">عام</TabsTrigger>
          <TabsTrigger value="finance" className="flex-1 sm:flex-initial">المالية والعملات</TabsTrigger>
          <TabsTrigger value="legal" className="flex-1 sm:flex-initial">الشروط والأحكام</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">المعلومات الأساسية</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم التطبيق</Label>
                <Input 
                  value={formData['app_name']} 
                  onChange={(e) => handleChange('app_name', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني للدعم</Label>
                <Input 
                  type="email" 
                  value={formData['support_email']} 
                  onChange={(e) => handleChange('support_email', e.target.value)} 
                />
              </div>
            </div>
            
            <div className="mt-6 flex flex-col space-y-3">
              <h4 className="font-semibold text-sm">حالة التطبيق</h4>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch 
                  id="maintenance" 
                  checked={formData['maintenance_mode']}
                  onCheckedChange={(c) => handleChange('maintenance_mode', c)}
                />
                <Label htmlFor="maintenance">
                  تفعيل وضع الصيانة (لن يتمكن المستخدمون من الدخول)
                </Label>
              </div>
            </div>

            <Button 
              className="mt-8 w-full sm:w-auto" 
              onClick={() => saveMutation.mutate(['app_name', 'support_email', 'maintenance_mode'])}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Coins className="size-5 text-amber-500" />
              إعدادات الأرباح وسعر الصرف
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>نسبة التطبيق من الهدايا (%)</Label>
                <Input 
                  type="number" 
                  value={formData['app_fee_percentage']} 
                  onChange={(e) => handleChange('app_fee_percentage', Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>سعر الصرف (كم عملة لكل 1 دولار)</Label>
                <Input 
                  type="number" 
                  value={formData['coin_exchange_rate']} 
                  onChange={(e) => handleChange('coin_exchange_rate', Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Gem className="size-4 text-cyan-500" />
                  معدل تحويل الجواهر (عملة لكل 1 ماسة)
                </Label>
                <Input 
                  type="number" 
                  value={formData['diamond_exchange_rate']} 
                  onChange={(e) => handleChange('diamond_exchange_rate', Number(e.target.value))} 
                />
                <p className="text-xs text-muted-foreground">كم عملة يربح المستخدم عند تحويل 1 ماسة في المحفظة</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="size-5 text-fuchsia-500 shrink-0" />
                  باقات شحن العملات في التطبيق (Coin Packages)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  تحديد أسعار الباقات، عدد العملات، وتحديد خيارات (الأفضل قيمة Best Value أو Popular) لتظهر مباشرة في محفظة المستخدم.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddPackage} className="gap-1.5 shrink-0 self-start sm:self-auto">
                <Plus className="size-4" />
                إضافة باقة جديدة
              </Button>
            </div>

            <div className="space-y-3">
              {(formData['coin_packages'] || []).map((pkg: CoinPackage, index: number) => (
                <div 
                  key={pkg.id || index}
                  className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 rounded-lg border bg-muted/30"
                >
                  <div className="w-full sm:w-36 space-y-1">
                    <Label className="text-xs">عدد العملات</Label>
                    <Input 
                      value={pkg.coins} 
                      placeholder="مثال: 500"
                      onChange={(e) => handlePackageChange(index, 'coins', e.target.value)} 
                    />
                  </div>
                  <div className="w-full sm:w-32 space-y-1">
                    <Label className="text-xs">السعر مع العملة</Label>
                    <Input 
                      value={pkg.price} 
                      placeholder="مثال: $7.99"
                      onChange={(e) => handlePackageChange(index, 'price', e.target.value)} 
                    />
                  </div>
                  <div className="w-full sm:w-44 space-y-1">
                    <Label className="text-xs">شارة التميز (Badge)</Label>
                    <Input 
                      value={pkg.badge || ''} 
                      placeholder="مثال: Best Value"
                      onChange={(e) => handlePackageChange(index, 'badge', e.target.value || null)} 
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 lg:pt-6">
                    <Switch 
                      id={`pop-${index}`}
                      checked={!!pkg.popular}
                      onCheckedChange={(val) => handlePackageChange(index, 'popular', val)}
                    />
                    <Label htmlFor={`pop-${index}`} className="text-xs font-normal cursor-pointer">
                      تمييز كباقة رئيسية (Highlight)
                    </Label>
                  </div>
                  <div className="lg:ms-auto pt-2 lg:pt-6 self-end lg:self-auto">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemovePackage(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="mt-6 w-full sm:w-auto" 
              onClick={() => saveMutation.mutate(['app_fee_percentage', 'coin_exchange_rate', 'diamond_exchange_rate', 'coin_packages'])}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              حفظ إعدادات المالية والباقات
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="legal" className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">النصوص القانونية</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>شروط الاستخدام (عربي)</Label>
                <Textarea 
                  className="min-h-[120px]" 
                  value={formData['terms_of_use']}
                  onChange={(e) => handleChange('terms_of_use', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>سياسة الخصوصية (عربي)</Label>
                <Textarea 
                  className="min-h-[120px]" 
                  value={formData['privacy_policy']}
                  onChange={(e) => handleChange('privacy_policy', e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="mt-8 w-full sm:w-auto"
              onClick={() => saveMutation.mutate(['terms_of_use', 'privacy_policy'])}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
