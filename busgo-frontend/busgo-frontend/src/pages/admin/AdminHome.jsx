import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, IndianRupee, Ticket, Users } from "lucide-react";
import { api } from "../../lib/api.js";
import { money } from "../../lib/format.js";
import StatCard from "../../components/StatCard.jsx";
import { SampleBanner, usePreview } from "../../components/Preview.jsx";

const SAMPLE = { users: 412, bookings: 1280, revenue: 986400 };

export default function AdminHome() {
  const [ops, setOps] = useState(null);
  const stats = usePreview("/admin/stats", SAMPLE);

  // operators ki gintee asli hai (GET /admin/operators se)
  useEffect(() => {
    api("/admin/operators")
      .then((d) => setOps(d.operators ?? (Array.isArray(d) ? d : [])))
      .catch(() => setOps([]));
  }, []);

  const count = (s) => (ops ? ops.filter((o) => o.status === s).length : "…");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Overview</h1>
      <p className="mb-6 mt-1 text-sm text-mist">Everything on the platform at a glance.</p>

      <h2 className="mb-3 font-display text-lg font-bold">Operators</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Waiting for review" value={count("PENDING")} tone="text-headlight" hint="Needs your decision" />
        <StatCard icon={Building2} label="Approved" value={count("APPROVED")} tone="text-reflector" />
        <StatCard icon={Building2} label="Rejected" value={count("REJECTED")} tone="text-taillight" />
        <StatCard icon={Building2} label="Suspended" value={count("SUSPENDED")} tone="text-taillight" />
      </div>
      {ops && count("PENDING") > 0 && (
        <Link to="/admin/operators" className="btn btn-primary btn-sm mt-4 inline-flex">Review pending operators</Link>
      )}

      <h2 className="mb-3 mt-8 font-display text-lg font-bold">Platform</h2>
      {!stats.live && <SampleBanner path="/admin/stats" />}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Users" value={stats.data.users} />
        <StatCard icon={Ticket} label="Bookings" value={stats.data.bookings} tone="text-reflector" />
        <StatCard icon={IndianRupee} label="Gross sales" value={money(stats.data.revenue)} />
      </div>
    </div>
  );
}
