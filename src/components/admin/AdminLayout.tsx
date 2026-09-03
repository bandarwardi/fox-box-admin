import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Menu, Search, User as UserIcon, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { navItems } from "./nav";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 px-2">
      <span className="brand-gradient grid size-10 place-items-center rounded-xl text-lg font-extrabold text-primary-foreground shadow-pop">
        S
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-extrabold tracking-tight">ستريم برو</span>
        <span className="text-[11px] font-medium text-muted-foreground">لوحة الإدارة</span>
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
      {navItems.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-secondary",
            )}
          >
            <item.icon className={cn("size-5 shrink-0", active && "text-primary")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current =
    navItems.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)))?.label ??
    "لوحة التحكم";

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* القائمة الجانبية (يمين) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-sidebar-border bg-sidebar py-5 lg:flex">
        <div className="mb-6">
          <Logo />
        </div>
        <SidebarNav />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-sidebar py-5">
            <div className="mb-6 flex items-center justify-between pl-3">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="إغلاق">
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:mr-64">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="القائمة">
            <Menu className="size-6" />
          </button>
          <h1 className="text-lg font-extrabold tracking-tight">{current}</h1>

          <div className="relative mr-auto hidden w-72 md:block">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="بحث سريع عن مستخدم أو بث..."
              className="h-10 w-full rounded-xl border border-input bg-secondary/60 pr-9 pl-3 text-sm outline-none transition focus:border-ring focus:bg-card"
            />
          </div>

          <button
            className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary md:mr-2"
            aria-label="الإشعارات"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              7
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-secondary">
              <span className="brand-gradient grid size-9 place-items-center rounded-full text-sm font-bold text-primary-foreground">
                ب م
              </span>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-bold">بندر محمد</span>
                <span className="block text-[11px] text-muted-foreground">مدير عام</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="size-4" /> الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <LogOut className="size-4" /> تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
