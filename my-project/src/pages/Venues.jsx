import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Button, Card, Field, PageHeader, inputClass } from "../components/ui";

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState({ name: "", city: "", country: "Pakistan", type: "ground", capacity: "" });

  const load = async () => {
    const response = await api.venues.list();
    setVenues(response.data.venues || []);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.venues.create({
        name: form.name,
        type: form.type,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        address: { city: form.city, country: form.country },
      });
      toast.success("Venue created");
      setForm({ name: "", city: "", country: "Pakistan", type: "ground", capacity: "" });
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Grounds" title="Venues" description="Manage grounds, stadiums, and booking-friendly venue details." />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-black">Create venue</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="City"><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></Field>
            <Field label="Country"><input className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
            <Field label="Capacity"><input className={inputClass} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <Button>Create venue</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-black">Venue list</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {venues.map((venue) => (
              <div key={venue._id} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                    <MapPin />
                  </span>
                  <div>
                    <p className="font-black">{venue.name}</p>
                    <p className="text-sm text-slate-500">{venue.address?.city || "No city"} · {venue.capacity || 0} capacity</p>
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
