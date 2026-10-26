import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BusFront, IndianRupee, Route as RouteIcon, Ticket } from "lucide-react";
import { api } from "../../lib/api.js";
import { money } from "../../lib/format.js";
import StatCard from "../../components/StatCard.jsx";
import { SampleBanner, usePreview } from "../../components/Preview.jsx";
import { list } from "./shared.jsx";
import { useOperator } from "./OperatorShell.jsx";

const SAMPLE = { bookings: 128, revenue: 214500 };

export default function OperatorHome() {
  const { op, approved, missing } = useOperator();
  const [buses, setBuses] = useState(null);
  const [trips, setTrips] = useState(null);
  // bookings aur revenue ki API nahi hai, isliye preview
  const stats = usePreview("/operators/me/stats", SAMPLE);

  useEffect(() => {
    api("/buses").then((d) => setBuses(list(d, "buses"))).catch(() => setBuses([]));
    api("/trips").then((d) => setTrips(list(d, "trips"))).catch(() => setTrips([]));
  }, []);

  const upcoming = (trips || []).filter((t) => t.status === "SCHEDULED").length;
  const steps = [
    ["Upload PAN and GST", missing.length === 0, "/operator/documents"],
    ["Get approved by admin", approved, null],
    ["Add a bus", (buses || []).length > 0, "/operator/buses"],
    ["Publish a trip", (trips || []).length > 0, "/operator/trips"],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Welcome, {op.agencyName}</h1>
      <p className="mb-6 mt-1 text-sm text-mist">Here is how your agency is doing.</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BusFront} label="Buses" value={buses ? buses.length : "…"} />
        <StatCard icon={RouteIcon} label="Upcoming trips" value={trips ? upcoming : "…"} tone="text-reflector" />
        <StatCard icon={Ticket} label="Bookings" value={stats.data.bookings} tone="text-taillight" />
        <StatCard icon={IndianRupee} label="Revenue" value={money(stats.data.revenue)} hint={`After ${op.commissionPct}% commission`} />
      </div>
      {!stats.live && <div className="mt-4"><SampleBanner path="/operators/me/stats" /></div>}

      <h2 className="mb-3 mt-8 font-display text-lg font-bold">Getting started</h2>
      <ol className="grid gap-2">
        {steps.map(([label, done, to], i) => (
          <li key={label} className="flex items-center gap-3 rounded-xl border border-line bg-asphalt px-4 py-3 text-sm">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${done ? "bg-reflector text-night" : "bg-kerb text-mist"}`}>{done ? "✓" : i + 1}</span>
            <span className={done ? "text-mist line-through" : ""}>{label}</span>
            {!done && to && <Link to={to} className="ml-auto text-headlight hover:underline">Open</Link>}
          </li>
        ))}
      </ol>
    </div>
  );
}
