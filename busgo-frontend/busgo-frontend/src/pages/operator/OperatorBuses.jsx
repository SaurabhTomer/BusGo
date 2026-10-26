import { useCallback, useEffect, useState } from "react";
import { BusFront, Plus } from "lucide-react";
import { api } from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Loader from "../../components/Loader.jsx";
import Empty from "../../components/Empty.jsx";
import Field from "../../components/Field.jsx";
import { UploadButton, list } from "./shared.jsx";
import { useOperator } from "./OperatorShell.jsx";

function BusesView({ approved, docs, reloadDocs }) {
  const toast = useToast();
  const [buses, setBuses] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", busNumber: "", type: "SEATER", totalSeats: 40 });

  const load = useCallback(() => api("/buses").then((d) => setBuses(list(d, "buses"))).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/buses", { method: "POST", body: { ...form, busNumber: form.busNumber.trim().toUpperCase(), totalSeats: Number(form.totalSeats) } });
      toast.success("Bus added with its seat map");
      setAdding(false);
      setForm({ name: "", busNumber: "", type: "SEATER", totalSeats: 40 });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadRc = async (bus, file) => {
    try {
      const body = new FormData();
      body.append("file", file);
      await api(`/buses/${bus.id}/rc`, { method: "POST", body });
      toast.success(`RC uploaded for ${bus.busNumber}`);
      reloadDocs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deactivate = async (bus) => {
    try {
      await api(`/buses/${bus.id}`, { method: "DELETE" });
      toast.success(`${bus.busNumber} is now inactive`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (buses === null) return <Loader label="Loading your buses" />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-mist">{buses.length} bus{buses.length === 1 ? "" : "es"}</p>
        <button className="btn btn-primary btn-sm" disabled={!approved} onClick={() => setAdding((v) => !v)}>
          <Plus size={16} /> Add bus
        </button>
      </div>

      {adding && (
        <form onSubmit={create} className="mb-6 grid gap-4 rounded-2xl border border-line bg-asphalt p-5 sm:grid-cols-2">
          <Field label="Bus name" id="bname" placeholder="Shivneri Deluxe" value={form.name} onChange={set("name")} required />
          <Field label="Registration number" id="bnum" placeholder="UP32AB1234" value={form.busNumber} onChange={set("busNumber")} required />
          <div>
            <label htmlFor="btype" className="mb-1.5 block text-sm font-medium">
              Type
            </label>
            <select id="btype" className="input" value={form.type} onChange={set("type")}>
              <option value="SEATER">Seater</option>
              <option value="SLEEPER">Sleeper</option>
            </select>
          </div>
          <Field label="Total seats" id="bseats" type="number" min={1} max={60} hint="Between 1 and 60. The seat map is created for you." value={form.totalSeats} onChange={set("totalSeats")} required />
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn btn-primary" disabled={busy}>{busy ? "Adding" : "Add bus"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}

      {buses.length === 0 ? (
        <Empty icon={BusFront} title="No buses yet" text={approved ? "Add your first bus to start publishing trips." : "You can add buses once your account is approved."} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {buses.map((b) => {
            const hasRc = docs.some((d) => d.type === "RC" && d.busId === b.id);
            return (
              <div key={b.id} className={`rounded-2xl border border-line bg-asphalt p-5 ${b.isActive === false ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold">{b.name}</h3>
                    <p className="tnum text-sm text-mist">{b.busNumber}</p>
                  </div>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-mist">{b.type === "SLEEPER" ? "Sleeper" : "Seater"}</span>
                </div>
                <p className="tnum mt-3 text-sm">{b.totalSeats} seats {b.isActive === false && "(inactive)"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <UploadButton label="Upload RC" done={hasRc} onFile={(f) => uploadRc(b, f)} />
                  {hasRc && <span className="text-xs font-semibold text-reflector">RC on file</span>}
                  {b.isActive !== false && (
                    <button className="btn btn-danger btn-sm ml-auto" onClick={() => deactivate(b)}>
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OperatorBuses() {
  const { approved, docs, loadDocs } = useOperator();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold">Buses</h1>
      <BusesView approved={approved} docs={docs} reloadDocs={loadDocs} />
    </div>
  );
}
