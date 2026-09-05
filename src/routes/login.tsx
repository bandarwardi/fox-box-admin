import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Lock, User } from "lucide-react"
import { api } from "@/lib/api"
import { BRAND } from "@/config/brand"

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: `تسجيل الدخول | ${BRAND.shortArabicName}` }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await api.post("/auth/admin/login", {
        username,
        password,
      })
      
      const { accessToken, admin } = response.data
      
      // Save token
      localStorage.setItem("admin_token", accessToken)
      localStorage.setItem("admin_user", JSON.stringify(admin))
      
      toast.success("تم تسجيل الدخول بنجاح")
      
      navigate({ to: "/" })
    } catch (error: any) {
      console.error("Login failed", error)
      toast.error(error.response?.data?.message || "بيانات الدخول غير صحيحة")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-card p-6 sm:p-8 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{BRAND.shortArabicName}</h1>
          <p className="text-muted-foreground">تسجيل الدخول للوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <div className="relative">
              <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                dir="ltr"
                className="pl-3 pr-9"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                dir="ltr"
                className="pl-3 pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
          </Button>
        </form>
      </div>
    </div>
  )
}
