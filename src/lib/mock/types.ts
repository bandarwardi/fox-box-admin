export type BanStatus = "active" | "temp_banned" | "perm_banned" | "device_banned";

export interface User {
  id: string;
  name: string;
  username: string;
  avatarHue: number;
  coins: number;
  beans: number;
  level: number;
  vip: "none" | "silver" | "gold" | "noble";
  verified: boolean;
  status: BanStatus;
  country: string;
  joinedAt: string;
}

export interface VerificationRequest {
  id: string;
  userName: string;
  username: string;
  followers: number;
  category: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface Agency {
  id: string;
  name: string;
  owner: string;
  streamers: number;
  revenueShare: number;
  monthlyRevenue: number;
  status: "active" | "suspended";
}

export interface Stream {
  id: string;
  title: string;
  streamer: string;
  viewers: number;
  giftsValue: number;
  durationMin: number;
  category: string;
  flagged: boolean;
  thumbHue: number;
}

export interface Gift {
  id: string;
  name: string;
  coins: number;
  beans: number;
  type: "2D" | "3D" | "SVGA";
  category: string;
  active: boolean;
  emoji: string;
}

export interface StoreItem {
  id: string;
  name: string;
  type: "إطار صورة" | "تأثير دخول" | "مركب" | "فقاعة دردشة";
  coins: number;
  durationDays: number;
  exclusivity: "الجميع" | "VIP فقط" | "مستوى 20+";
  format: "SVGA" | "WebP" | "PNG";
  active: boolean;
}

export interface LevelRow {
  level: number;
  xp: number;
  badge: string;
  reward: string;
  track: "supporter" | "streamer";
}

export interface NoblePackage {
  id: string;
  name: string;
  monthlyCoins: number;
  perks: string[];
  subscribers: number;
}

export interface Transaction {
  id: string;
  user: string;
  amount: number;
  coins: number;
  method: "Apple Pay" | "Google Play" | "بطاقة بنكية" | "محفظة إلكترونية";
  status: "مكتملة" | "قيد المعالجة" | "فاشلة";
  date: string;
}

export interface CashoutRequest {
  id: string;
  requester: string;
  type: "مذيع" | "وكالة";
  beans: number;
  amountUsd: number;
  method: string;
  status: "قيد المراجعة" | "تم التحويل" | "مرفوض";
  date: string;
}

export interface Report {
  id: string;
  target: string;
  targetType: "بث" | "رسالة" | "حساب";
  reason: string;
  reporter: string;
  date: string;
  status: "جديد" | "تحت المراجعة" | "مغلق";
}

export interface ActivityItem {
  id: string;
  kind: "signup" | "stream" | "gift" | "cashout" | "report";
  text: string;
  time: string;
}

export interface Banner {
  id: string;
  title: string;
  placement: "الرئيسية" | "المتجر" | "الاستكشاف";
  active: boolean;
  clicks: number;
  hue: number;
}
