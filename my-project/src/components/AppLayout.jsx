import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  LogOut,
  MapPin,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { clearCredentials, setTheme } from "../store/store";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const nav = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/matches/new", label: "New Match", icon: Plus },
  { to: "/teams", label: "Teams", icon: ShieldCheck },
  { to: "/players", label: "Players", icon: Users },
  { to: "/venues", label: "Venues", icon: MapPin },
];

function applyTheme(theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
}

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // The local session should still be cleared if the token is stale.
    }
    dispatch(clearCredentials());
    toast.success("Signed out");
    navigate("/login");
  };

  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_30%)]" />

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200/80 bg-white/85 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:block">
        <Link to="/" className="flex items-center gap-3 rounded-2xl px-2 py-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-soft">
            <Trophy size={23} />
          </span>
          <span>
            <span className="block font-display text-2xl font-black tracking-tight">GalliScore</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Match control room</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-soft dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-600 text-white">
              <UserRound size={19} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.username || "Scorer"}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role || "user"}</p>
            </div>
          </div>
          <button className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-950" onClick={logout}>
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} /> Logout
            </span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Link to="/" className="flex items-center gap-2 font-display text-xl font-black">
                <Trophy className="text-emerald-600" /> GalliScore
              </Link>
            </div>
            <div className="hidden text-sm text-slate-500 dark:text-slate-400 lg:block">
              Built for live cricket scoring, match operations, and clean post-match stats.
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold shadow-sm dark:border-white/10 dark:bg-white/5"
                onClick={() => dispatch(setTheme(nextTheme))}
                title={`Theme: ${theme}`}
              >
                {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <Link className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-emerald-500" to="/matches/new">
                New Match
              </Link>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                    isActive ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
