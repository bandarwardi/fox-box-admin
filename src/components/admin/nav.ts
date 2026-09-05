import {
  LayoutDashboard,
  Users,
  Radio,
  Mic,
  Wallet,
  Gift,
  ShoppingBag,
  Trophy,
  Coins,
  ShieldCheck,
  BarChart3,
  Settings,
  LifeBuoy,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof Users;
}

export const navItems: NavItem[] = [
  { label: "الرئيسية", to: "/", icon: LayoutDashboard },
  { label: "المستخدمون", to: "/users", icon: Users },
  { label: "البثوث", to: "/streams", icon: Radio },
  { label: "الغرف الصوتية", to: "/voice-rooms", icon: Mic },
  { label: "الإيرادات", to: "/revenue", icon: Wallet },
  { label: "الهدايا الافتراضية", to: "/gifts", icon: Gift },
  { label: "المتجر", to: "/store", icon: ShoppingBag },
  { label: "المستويات والتلعيب", to: "/levels", icon: Trophy },
  { label: "الاقتصاد والمالية", to: "/economy", icon: Coins },
  { label: "الرقابة والإشراف", to: "/moderation", icon: ShieldCheck },
  { label: "الإحصائيات", to: "/analytics", icon: BarChart3 },
  { label: "الإعدادات", to: "/settings", icon: Settings },
  { label: "الدعم", to: "/support", icon: LifeBuoy },
];
