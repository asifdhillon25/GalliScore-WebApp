import { motion } from "framer-motion";

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/[0.06] ${className}`}>{children}</div>;
}

export function StatCard({ label, value, detail, icon }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-black">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
        </div>
        {icon && <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{icon}</div>}
      </div>
    </Card>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    dark: "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-slate-950/40 dark:text-white";

export function EmptyState({ title, description, action }) {
  return (
    <Card className="grid place-items-center py-14 text-center">
      <div className="max-w-md">
        <p className="font-display text-2xl font-black">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Card>
  );
}

export function MotionCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.22 }} className={className}>
      {children}
    </motion.div>
  );
}
