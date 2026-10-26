import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Loader from "../../components/Loader.jsx";
import Empty from "../../components/Empty.jsx";

const arr = (d) => d?.cities ?? (Array.isArray(d) ? d : []);

export default function AdminCities() {
  const toast = useToast();
  const [cities, setCities] = useState(null);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api("/admin/cities").then((d) => setCities(arr(d))).catch((e) => { toast.error(e.message); setCities([]); }), [toast]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); toast.success(ok); load(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const add = (e) => {
    e.preventDefault();
    run(() => api("/admin/cities", { method: "POST", body: { name: name.trim() } }), "City added").then(() => setName(""));
  };
  const save = (c) => run(() => api(`/admin/cities/${c.id}`, { method: "PATCH", body: { name: editName.trim() } }), "City updated").then(() => setEditId(null));
  const remove = (c) => run(() => api(`/admin/cities/${c.id}`, { method: "DELETE" }), `${c.name} removed`);

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Cities</h1>
      <form onSubmit={add} className="mb-6 flex gap-3">
        <input className="input" placeholder="New city name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary shrink-0" disabled={busy || name.trim().length < 2}><Plus size={16} /> Add</button>
      </form>

      {cities === null ? (
        <Loader label="Loading cities" />
      ) : cities.length === 0 ? (
        <Empty icon={MapPin} title="No cities yet" text="Add cities so operators can publish trips between them." />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {cities.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl border border-line bg-asphalt px-4 py-3">
              {editId === c.id ? (
                <>
                  <input className="input !py-1.5" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                  <button className="btn btn-primary btn-sm" disabled={busy || editName.trim().length < 2} onClick={() => save(c)}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <button className="rounded-lg p-2 text-mist hover:text-ink" aria-label={`Rename ${c.name}`} onClick={() => { setEditId(c.id); setEditName(c.name); }}><Pencil size={15} /></button>
                  <button className="rounded-lg p-2 text-mist hover:text-taillight" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 size={15} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
