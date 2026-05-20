import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { playerName } from "../lib/format";
import { Button, Card, Field, PageHeader, inputClass } from "../components/ui";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", displayName: "", primaryRole: "batsman", battingStyle: "right-hand", bowlingStyle: "" });

  const load = async () => {
    const response = await api.players.list();
    setPlayers(response.data.players || []);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.players.create({ ...form, bowlingStyle: form.bowlingStyle || null });
      toast.success("Player created");
      setForm({ firstName: "", lastName: "", displayName: "", primaryRole: "batsman", battingStyle: "right-hand", bowlingStyle: "" });
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Roster" title="Players" description="Register players and use them in playing XIs." />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-black">Create player</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name"><input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
              <Field label="Last name"><input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
            </div>
            <Field label="Display name"><input className={inputClass} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required /></Field>
            <Field label="Primary role">
              <select className={inputClass} value={form.primaryRole} onChange={(e) => setForm({ ...form, primaryRole: e.target.value })}>
                {["batsman", "bowler", "all-rounder", "wicket-keeper"].map((role) => <option key={role}>{role}</option>)}
              </select>
            </Field>
            <Button>Create player</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-black">Player pool</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {players.map((player) => (
              <div key={player._id} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                    <UserRound />
                  </span>
                  <div>
                    <p className="font-black">{playerName(player)}</p>
                    <p className="text-sm capitalize text-slate-500">{player.primaryRole || "player"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
