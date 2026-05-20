import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Shield, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { setCredentials } from "../store/store";
import { Button, Field, inputClass } from "../components/ui";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "scorer",
  });

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = isSignup
        ? await api.auth.register(form)
        : await api.auth.login({ email: form.email, password: form.password });

      dispatch(setCredentials(response.data));
      toast.success(isSignup ? "Account created" : "Welcome back");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.28),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.24),transparent_30%)]" />
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex items-center px-6 py-10 lg:px-14">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <Trophy className="text-emerald-300" />
              <span className="font-display text-2xl font-black">GalliScore</span>
            </div>
            <h1 className="font-display text-5xl font-black tracking-tight md:text-7xl">
              Modern scoring for every local cricket match.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Create teams, run toss, start innings, score every ball, and review match stats from one clean control room.
            </p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {["Live scoring", "Stats", "Teams"].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm font-bold backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="flex items-center justify-center px-4 py-10">
          <motion.form
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={submit}
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">{isSignup ? "Create access" : "Secure login"}</p>
                <h2 className="mt-2 font-display text-3xl font-black">{isSignup ? "Start scoring" : "Welcome back"}</h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Shield />
              </span>
            </div>

            <div className="space-y-4">
              {isSignup && (
                <>
                  <Field label="Username">
                    <input className={inputClass} value={form.username} onChange={update("username")} required />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name">
                      <input className={inputClass} value={form.firstName} onChange={update("firstName")} />
                    </Field>
                    <Field label="Last name">
                      <input className={inputClass} value={form.lastName} onChange={update("lastName")} />
                    </Field>
                  </div>
                  <Field label="Role">
                    <select className={inputClass} value={form.role} onChange={update("role")}>
                      <option value="scorer">Scorer</option>
                      <option value="team_manager">Team manager</option>
                      <option value="umpire">Umpire</option>
                      <option value="player">Player</option>
                    </select>
                  </Field>
                </>
              )}
              <Field label="Email">
                <input className={inputClass} type="email" value={form.email} onChange={update("email")} required />
              </Field>
              <Field label="Password">
                <input
                  className={inputClass}
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  minLength={6}
                  required
                />
                {isSignup && (
                  <span className="mt-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Use at least 6 characters with uppercase, lowercase, and a number.
                  </span>
                )}
              </Field>
            </div>

            <Button className="mt-6 w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
            </Button>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              {isSignup ? "Already have an account?" : "Need an account?"}{" "}
              <Link className="font-black text-emerald-600" to={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Login" : "Sign up"}
              </Link>
            </p>
          </motion.form>
        </section>
      </div>
    </div>
  );
}
