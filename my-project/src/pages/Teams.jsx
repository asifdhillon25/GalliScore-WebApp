import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Button, Card, Field, PageHeader, inputClass } from "../components/ui";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: "", shortName: "", city: "", type: "local" });

  const load = async () => {
    const response = await api.teams.list();
    setTeams(response.data.teams || []);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.teams.create({ ...form, shortName: form.shortName.toUpperCase() });
      toast.success("Team created");
      setForm({ name: "", shortName: "", city: "", type: "local" });
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Squads" title="Teams" description="Create and inspect teams used by fixtures and scoring." />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-black">Create team</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Short name"><input className={inputClass} value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} required maxLength={10} /></Field>
            <Field label="City"><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {["local", "club", "school", "college", "corporate", "regional", "national"].map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Button>Create team</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-black">Team list</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team._id} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <ShieldCheck />
                  </span>
                  <div>
                    <p className="font-black">{team.name}</p>
                    <p className="text-sm text-slate-500">{team.shortName} · {team.city || "No city"}</p>
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
