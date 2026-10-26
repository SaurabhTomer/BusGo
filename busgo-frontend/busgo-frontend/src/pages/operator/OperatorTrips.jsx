import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Route as RouteIcon } from "lucide-react";
import { api } from "../../lib/api.js";
import { getCities } from "../../lib/pay.js";
import { dateOf, isoToLocal, localToIso, money, timeOf } from "../../lib/format.js";
import { useToast } from "../../context/ToastContext.jsx";
import Loader from "../../components/Loader.jsx";
import Empty from "../../components/Empty.jsx";
import Field from "../../components/Field.jsx";
import Modal from "../../components/Modal.jsx";
import StatusChip from "../../components/StatusChip.jsx";
import { list } from "./shared.jsx";
import { useOperator } from "./OperatorShell.jsx";

function TripsView({ approved }) {
  const toast = useToast();
  const [trips, setTrips] = useState(null);
  const [buses, setBuses] = useState([]);
  const [cities, setCities] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // jis trip ko edit kar rahe hain
  const [edit, setEdit] = useState({ price: "", departureTime: "", arrivalTime: "" });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ busId: "", sourceCityId: "", destinationCityId: "", departureTime: "", arrivalTime: "", price: "" });

  const load = useCallback(() => api("/trips").then((d) => setTrips(list(d, "trips"))).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => {
    load();
    api("/buses").then((d) => setBuses(list(d, "buses").filter((b) => b.isActive !== false))).catch(() => {});
    getCities().then(setCities).catch(() => {});
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = Object.values(form).every(Boolean) && form.sourceCityId !== form.destinationCityId;

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/trips", {
        method: "POST",
        body: {
          busId: form.busId,
          sourceCityId: form.sourceCityId,
          destinationCityId: form.destinationCityId,
          departureTime: localToIso(form.departureTime),
          arrivalTime: localToIso(form.arrivalTime),
          price: Number(form.price),
        },
      });
      toast.success("Trip published. Customers can find it now.");
      setAdding(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (t) => {
    setEditing(t);
    setEdit({ price: t.price, departureTime: isoToLocal(t.departureTime), arrivalTime: isoToLocal(t.arrivalTime) });
  };

  // PATCH /trips/:id
  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/trips/${editing.id}`, {
        method: "PATCH",
        body: { price: Number(edit.price), departureTime: localToIso(edit.departureTime), arrivalTime: localToIso(edit.arrivalTime) },
      });
      toast.success("Trip updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelTrip = async (t) => {
    try {
      await api(`/trips/${t.id}/cancel`, { method: "PATCH" });
      toast.success("Trip cancelled");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (trips === null) return <Loader label="Loading your trips" />;

  const cityName = (t, side) => t.route?.[side === "from" ? "sourceCity" : "destinationCity"]?.name;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-mist">{trips.length} trip{trips.length === 1 ? "" : "s"}</p>
        <button className="btn btn-primary btn-sm" disabled={!approved || buses.length === 0} onClick={() => setAdding((v) => !v)}>
          <Plus size={16} /> Publish trip
        </button>
      </div>
      {approved && buses.length === 0 && <p className="mb-4 text-sm text-mist">Add a bus first, then you can publish trips.</p>}

      {adding && (
        <form onSubmit={create} className="mb-6 grid gap-4 rounded-2xl border border-line bg-asphalt p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="tbus" className="mb-1.5 block text-sm font-medium">Bus</label>
            <select id="tbus" className="input" value={form.busId} onChange={set("busId")} required>
              <option value="">Select bus</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.busNumber})</option>
              ))}
            </select>
          </div>
          {[["sourceCityId", "Leaving from"], ["destinationCityId", "Going to"]].map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1.5 block text-sm font-medium">{label}</label>
              <select id={key} className="input" value={form[key]} onChange={set(key)} required>
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ))}
          <Field label="Departure (IST)" id="dep" type="datetime-local" value={form.departureTime} onChange={set("departureTime")} required />
          <Field label="Arrival (IST)" id="arr" type="datetime-local" value={form.arrivalTime} onChange={set("arrivalTime")} required />
          <Field label="Price per seat (₹)" id="price" type="number" min={1} max={20000} value={form.price} onChange={set("price")} required />
          <div className="flex items-end gap-3">
            <button className="btn btn-primary" disabled={!ready || busy}>{busy ? "Publishing" : "Publish trip"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}

      {trips.length === 0 ? (
        <Empty icon={RouteIcon} title="No trips yet" text="Publish a trip and it shows up in customer search right away." />
      ) : (
        <div className="flex flex-col gap-3">
          {trips.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-asphalt p-5">
              <div>
                <p className="font-display text-lg font-bold">
                  {cityName(t, "from") && cityName(t, "to") ? `${cityName(t, "from")} to ${cityName(t, "to")}` : "Trip"}
                </p>
                <p className="tnum text-sm text-mist">
                  {dateOf(t.departureTime)}, {timeOf(t.departureTime)} to {timeOf(t.arrivalTime)}
                  {t.bus?.name && ` on ${t.bus.name}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="tnum font-display text-lg font-bold">{money(t.price)}</span>
                <StatusChip status={t.status} />
                {t.status === "SCHEDULED" && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => cancelTrip(t)}>
                      Cancel trip
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} title="Edit trip" onClose={() => setEditing(null)}>
        <form onSubmit={saveEdit} className="grid gap-4">
          <Field label="Departure (IST)" id="edep" type="datetime-local" value={edit.departureTime} onChange={(e) => setEdit({ ...edit, departureTime: e.target.value })} required />
          <Field label="Arrival (IST)" id="earr" type="datetime-local" value={edit.arrivalTime} onChange={(e) => setEdit({ ...edit, arrivalTime: e.target.value })} required />
          <Field label="Price per seat (₹)" id="eprice" type="number" min={1} max={20000} value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} required />
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving" : "Save changes"}</button>
        </form>
      </Modal>
    </div>
  );
}

export default function OperatorTrips() {
  const { approved } = useOperator();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold">Trips</h1>
      <TripsView approved={approved} />
    </div>
  );
}
