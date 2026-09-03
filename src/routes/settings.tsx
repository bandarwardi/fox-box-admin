import { createFileRoute } from "@tanstack/react-router"
import { Save, Loader2 } from "lucide-react"
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

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "إعدادات التطبيق | ستريم برو" }],
  }),
  component: SettingsPage,
})

type Setting = {
  key: string
  value: any
}

function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({
    app_name: "ستريم برو",
    support_email: "support@example.com",
    maintenance_mode: false,
    app_fee_percentage: 30,
    coin_exchange_rate: 100,
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
      setFormData(newForm);
    }
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
        <TabsList className="mb-6 grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="finance">المالية</TabsTrigger>
          <TabsTrigger value="legal">الشروط والأحكام</TabsTrigger>
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
              className="mt-8" 
              onClick={() => saveMutation.mutate(['app_name', 'support_email', 'maintenance_mode'])}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">إعدادات الأرباح والعمولات</h3>
            <div className="grid gap-6 md:grid-cols-2">
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
            </div>

            <Button 
              className="mt-8"
              onClick={() => saveMutation.mutate(['app_fee_percentage', 'coin_exchange_rate'])}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              حفظ التغييرات
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
              className="mt-8"
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
