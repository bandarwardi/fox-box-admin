/**
 * طبقة البيانات المعزولة (Data Service Layer)
 * ----------------------------------------------
 * كل دالة هنا تعيد Promise حتى يسهل استبدال المصدر لاحقاً بطلبات HTTP
 * فعلية إلى NestJS API دون أي تعديل على مكوّنات الواجهة.
 */
import type {
  ActivityItem,
  Agency,
  Banner,
  CashoutRequest,
  Gift,
  LevelRow,
  NoblePackage,
  Report,
  StoreItem,
  Stream,
  Transaction,
  User,
  VerificationRequest,
} from "./types";

const delay = <T,>(data: T): Promise<T> => Promise.resolve(data);

/** فهرسة دائرية آمنة للأنواع */
const at = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length] as T;

const arabicNames = [
  "نورة القحطاني",
  "بندر العتيبي",
  "ليان الحربي",
  "سلطان المطيري",
  "دانة الشمري",
  "فيصل الدوسري",
  "رهف العنزي",
  "طلال الغامدي",
  "جواهر السبيعي",
  "ماجد الزهراني",
  "شهد البقمي",
  "عبدالله الرشيد",
  "لمار الجهني",
  "خالد الصاعدي",
  "أثير الفهد",
  "ياسر النعيمي",
  "غادة المالكي",
  "راكان الشهري",
];

const countries = ["السعودية", "الإمارات", "مصر", "الكويت", "المغرب", "العراق", "الأردن"];

export const users: User[] = arabicNames.map((name, i) => ({
  id: `U-${1000 + i}`,
  name,
  username: `@user_${1000 + i}`,
  avatarHue: (i * 37) % 360,
  coins: 4200 + i * 8130,
  beans: 1200 + i * 5400,
  level: 3 + ((i * 5) % 42),
  vip: at((["none", "silver", "gold", "noble"] as const), i),
  verified: i % 3 === 0,
  status: at(
    ["active", "active", "active", "temp_banned", "perm_banned", "device_banned"] as const,
    i,
  ),
  country: at(countries, i),
  joinedAt: `2026-0${(i % 8) + 1}-${10 + (i % 18)}`,
}));

export const verificationRequests: VerificationRequest[] = arabicNames
  .slice(0, 7)
  .map((name, i) => ({
    id: `V-${200 + i}`,
    userName: name,
    username: `@user_${1000 + i}`,
    followers: 24000 + i * 51000,
    category: at(["فنان", "رياضي", "مؤثر", "إعلامي", "موسيقي"], i),
    submittedAt: `2026-08-${12 + i}`,
    status: at((["pending", "pending", "approved", "rejected"] as const), i),
  }));

export const agencies: Agency[] = [
  { id: "AG-01", name: "وكالة النجوم", owner: "سلطان المطيري", streamers: 48, revenueShare: 25, monthlyRevenue: 184300, status: "active" },
  { id: "AG-02", name: "وكالة الماس", owner: "نورة القحطاني", streamers: 31, revenueShare: 20, monthlyRevenue: 121750, status: "active" },
  { id: "AG-03", name: "وكالة القمة", owner: "ماجد الزهراني", streamers: 26, revenueShare: 22, monthlyRevenue: 96400, status: "active" },
  { id: "AG-04", name: "وكالة الأفق", owner: "رهف العنزي", streamers: 12, revenueShare: 15, monthlyRevenue: 38900, status: "suspended" },
];

export const streams: Stream[] = arabicNames.slice(0, 12).map((name, i) => ({
  id: `S-${500 + i}`,
  title: at(["دردشة مسائية", "تحدي الغناء", "بث ألعاب PUBG", "جلسة شعر", "توب لايف", "منافسة PK"], i),
  streamer: name,
  viewers: 320 + i * 917,
  giftsValue: 1500 + i * 3400,
  durationMin: 25 + i * 13,
  category: at(["ترفيه", "غناء", "ألعاب", "ثقافة"], i),
  flagged: i % 5 === 0,
  thumbHue: (i * 53) % 360,
}));

export const gifts: Gift[] = [
  { id: "G-01", name: "قلب ذهبي", coins: 199, beans: 120, type: "2D", category: "رومانسي", active: true, emoji: "💛" },
  { id: "G-02", name: "تاج الملوك", coins: 4999, beans: 3200, type: "3D", category: "فخامة", active: true, emoji: "👑" },
  { id: "G-03", name: "صاروخ", coins: 9999, beans: 6400, type: "SVGA", category: "ملحمي", active: true, emoji: "🚀" },
  { id: "G-04", name: "وردة", coins: 10, beans: 6, type: "2D", category: "رومانسي", active: true, emoji: "🌹" },
  { id: "G-05", name: "أسد أسطوري", coins: 15999, beans: 10200, type: "3D", category: "ملحمي", active: true, emoji: "🦁" },
  { id: "G-06", name: "قلعة", coins: 29999, beans: 19500, type: "SVGA", category: "فخامة", active: false, emoji: "🏰" },
];

export const storeItems: StoreItem[] = [
  { id: "IT-01", name: "إطار نيون بنفسجي", type: "إطار صورة", coins: 1200, durationDays: 30, exclusivity: "الجميع", format: "SVGA", active: true },
  { id: "IT-02", name: "دخول التنين", type: "تأثير دخول", coins: 4500, durationDays: 30, exclusivity: "VIP فقط", format: "SVGA", active: true },
  { id: "IT-03", name: "مركب اليخت الذهبي", type: "مركب", coins: 8900, durationDays: 7, exclusivity: "مستوى 20+", format: "WebP", active: true },
  { id: "IT-04", name: "فقاعة دردشة وردية", type: "فقاعة دردشة", coins: 700, durationDays: 30, exclusivity: "الجميع", format: "PNG", active: true },
  { id: "IT-05", name: "إطار الماس", type: "إطار صورة", coins: 3200, durationDays: 30, exclusivity: "VIP فقط", format: "SVGA", active: false },
];

export const levels: LevelRow[] = Array.from({ length: 10 }, (_, i) => ({
  level: (i + 1) * 5,
  xp: (i + 1) * 12500,
  badge: at(["🥉", "🥈", "🥇", "💎", "👑", "🔥", "⚡", "🌟", "🛡️", "🏆"], i),
  reward: at([
    "إطار برونزي",
    "500 عملة",
    "إطار فضي",
    "1,200 عملة",
    "تأثير دخول",
    "إطار ذهبي",
    "2,500 عملة",
    "مركب حصري",
    "شارة أسطورية",
    "10,000 عملة",
  ], i),
  track: i % 2 === 0 ? "supporter" : "streamer",
}));

export const noblePackages: NoblePackage[] = [
  { id: "N-01", name: "نبيل فضي", monthlyCoins: 9900, perks: ["شارة فضية", "دخول مميز", "فقاعة دردشة"], subscribers: 1840 },
  { id: "N-02", name: "نبيل ذهبي", monthlyCoins: 29900, perks: ["شارة ذهبية", "إطار حصري", "حماية من الطرد", "دخول متخفي"], subscribers: 620 },
  { id: "N-03", name: "نبيل ملكي", monthlyCoins: 99900, perks: ["تاج ملكي", "مركب أسطوري", "أولوية الدعم", "قائمة صدارة خاصة"], subscribers: 96 },
];

export const transactions: Transaction[] = arabicNames.slice(0, 10).map((name, i) => ({
  id: `TX-${9000 + i}`,
  user: name,
  amount: 49 + i * 137,
  coins: 5000 + i * 12000,
  method: at((["Apple Pay", "Google Play", "بطاقة بنكية", "محفظة إلكترونية"] as const), i),
  status: at((["مكتملة", "مكتملة", "قيد المعالجة", "فاشلة"] as const), i),
  date: `2026-08-${14 + i}`,
}));

export const cashoutRequests: CashoutRequest[] = arabicNames.slice(0, 8).map((name, i) => ({
  id: `CO-${300 + i}`,
  requester: i % 3 === 0 ? at(agencies, i).name : name,
  type: i % 3 === 0 ? "وكالة" : "مذيع",
  beans: 40000 + i * 23000,
  amountUsd: 400 + i * 230,
  method: at(["تحويل بنكي", "PayPal", "Wise"], i),
  status: at((["قيد المراجعة", "قيد المراجعة", "تم التحويل", "مرفوض"] as const), i),
  date: `2026-08-${16 + i}`,
}));

export const reports: Report[] = arabicNames.slice(0, 9).map((name, i) => ({
  id: `R-${700 + i}`,
  target: i % 2 === 0 ? `بث #${500 + i}` : name,
  targetType: at((["بث", "رسالة", "حساب"] as const), i),
  reason: at(["محتوى غير لائق", "تحريض وكراهية", "انتحال شخصية", "إعلانات مزعجة", "احتيال"], i),
  reporter: `@user_${1200 + i}`,
  date: `2026-08-${20 + (i % 9)}`,
  status: at((["جديد", "تحت المراجعة", "مغلق"] as const), i),
}));

export const bannedWords = [
  "كلمة1",
  "شتيمة",
  "رابط خارجي",
  "بيع حسابات",
  "أرقام تواصل",
  "عبارة مخلة",
  "تحريض",
  "احتيال",
];

export const banners: Banner[] = [
  { id: "B-01", title: "مسابقة الصيف الكبرى", placement: "الرئيسية", active: true, clicks: 184300, hue: 293 },
  { id: "B-02", title: "خصم 30% على العملات", placement: "المتجر", active: true, clicks: 92400, hue: 340 },
  { id: "B-03", title: "أسبوع النبلاء", placement: "الاستكشاف", active: false, clicks: 41200, hue: 70 },
];

export const activity: ActivityItem[] = [
  { id: "A1", kind: "signup", text: "تسجيل مستخدم جديد: نورة القحطاني", time: "قبل دقيقتين" },
  { id: "A2", kind: "stream", text: "بدأ بندر العتيبي بثاً مباشراً «تحدي الغناء»", time: "قبل 6 دقائق" },
  { id: "A3", kind: "gift", text: "شراء هدية «تاج الملوك» بقيمة 4,999 عملة", time: "قبل 11 دقيقة" },
  { id: "A4", kind: "cashout", text: "طلب سحب جديد من وكالة النجوم — 2,400$", time: "قبل 23 دقيقة" },
  { id: "A5", kind: "report", text: "بلاغ جديد ضد البث #512 — محتوى غير لائق", time: "قبل 34 دقيقة" },
  { id: "A6", kind: "gift", text: "شراء هدية «صاروخ» بقيمة 9,999 عملة", time: "قبل 48 دقيقة" },
  { id: "A7", kind: "signup", text: "تسجيل مستخدم جديد: ياسر النعيمي", time: "قبل ساعة" },
];

export const monthlySeries = [
  { month: "يناير", revenue: 412000, viewers: 182000 },
  { month: "فبراير", revenue: 458000, viewers: 196000 },
  { month: "مارس", revenue: 503000, viewers: 214000 },
  { month: "أبريل", revenue: 486000, viewers: 208000 },
  { month: "مايو", revenue: 552000, viewers: 236000 },
  { month: "يونيو", revenue: 604000, viewers: 251000 },
  { month: "يوليو", revenue: 651000, viewers: 268000 },
  { month: "أغسطس", revenue: 712000, viewers: 289000 },
  { month: "سبتمبر", revenue: 688000, viewers: 279000 },
  { month: "أكتوبر", revenue: 745000, viewers: 301000 },
  { month: "نوفمبر", revenue: 812000, viewers: 328000 },
  { month: "ديسمبر", revenue: 903000, viewers: 361000 },
];

export const weeklySeries = [
  { month: "السبت", revenue: 24100, viewers: 12800 },
  { month: "الأحد", revenue: 26800, viewers: 13600 },
  { month: "الاثنين", revenue: 22400, viewers: 11900 },
  { month: "الثلاثاء", revenue: 28900, viewers: 14700 },
  { month: "الأربعاء", revenue: 31200, viewers: 15800 },
  { month: "الخميس", revenue: 38400, viewers: 19200 },
  { month: "الجمعة", revenue: 42700, viewers: 21400 },
];

export const dauSeries = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}/8`,
  dau: 118000 + Math.round(Math.sin(i / 2) * 9000) + i * 1200,
  mau: 940000 + i * 4200,
}));

export const giftBreakdown = [
  { name: "قلوب ورموز", value: 34 },
  { name: "هدايا فخامة", value: 26 },
  { name: "هدايا ملحمية", value: 18 },
  { name: "مؤثرات دخول", value: 14 },
  { name: "أخرى", value: 8 },
];

export const topStreamers = arabicNames.slice(0, 6).map((name, i) => ({
  id: `TS-${i}`,
  name,
  revenue: 184000 - i * 21400,
  avgViewers: 12400 - i * 1310,
  gifts: 42800 - i * 5200,
  avatarHue: (i * 61) % 360,
}));

export const topSupporters = arabicNames.slice(6, 12).map((name, i) => ({
  id: `SP-${i}`,
  name,
  spent: 96000 - i * 12300,
  level: 48 - i * 3,
  avatarHue: (i * 47 + 120) % 360,
}));

export const dataService = {
  getUsers: () => delay(users),
  getVerificationRequests: () => delay(verificationRequests),
  getAgencies: () => delay(agencies),
  getStreams: () => delay(streams),
  getGifts: () => delay(gifts),
  getStoreItems: () => delay(storeItems),
  getLevels: () => delay(levels),
  getNoblePackages: () => delay(noblePackages),
  getTransactions: () => delay(transactions),
  getCashoutRequests: () => delay(cashoutRequests),
  getReports: () => delay(reports),
  getBannedWords: () => delay(bannedWords),
  getBanners: () => delay(banners),
  getActivity: () => delay(activity),
  getAnalytics: () => delay({ monthlySeries, weeklySeries, dauSeries, giftBreakdown }),
};

export const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
export const fmtUsd = (n: number) =>
  `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`;
