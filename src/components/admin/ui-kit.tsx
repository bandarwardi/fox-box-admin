import { ArrowUpRight, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("card-surface min-w-0 overflow-hidden", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-extrabold tracking-tight truncate">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        </div>
      )}
      <div className={cn(padded ? "p-5" : "pb-2", "min-w-0 overflow-hidden")}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  delta,
  warn,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  warn?: string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
        {warn ? (
          <span className="grid size-8 place-items-center rounded-lg bg-warning-soft text-warning">
            <TriangleAlert className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs font-bold">
        {delta && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success-soft px-2 py-1 text-success">
            <ArrowUpRight className="size-3.5" />
            {delta}
          </span>
        )}
        {warn && (
          <span className="inline-flex items-center rounded-lg bg-warning-soft px-2 py-1 text-warning">
            {warn}
          </span>
        )}
        {hint && <span className="font-medium text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

const pillStyles = {
  neutral: "bg-secondary text-secondary-foreground",
  primary: "bg-primary-soft text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
} as const;

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof pillStyles;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap",
        pillStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, hue, size = 36, className }: { name: string; hue: number; size?: number; className?: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("");
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${(hue + 40) % 360} 75% 60%))`,
      }}
    >
      {initials}
    </span>
  );
}

export function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function DataTable({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[500px] text-right text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-3 text-xs font-bold text-muted-foreground text-start"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap px-4 py-3 align-middle", className)}>{children}</td>;
}
