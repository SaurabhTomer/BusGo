import { useState } from "react";
import { Ticket } from "lucide-react";
import { money } from "../../lib/format.js";
import Empty from "../../components/Empty.jsx";
import Loader from "../../components/Loader.jsx";
import StatusChip from "../../components/StatusChip.jsx";
import { SampleBanner, usePreview } from "../../components/Preview.jsx";

const PATH = "/admin/bookings";
const SAMPLE = [
  { id: "b1", passenger: "Aarav Sharma", operator: "Shivneri Travels", route: "Lucknow to Delhi", date: "2026-11-05", amount: 1800, commission: 180, status: "CONFIRMED" },
  { id: "b2", passenger: "Priya Verma", operator: "Shivneri Travels", route: "Lucknow to Delhi", date: "2026-11-05", amount: 900, commission: 90, status: "CONFIRMED" },
  { id: "b3", passenger: "Rohan Gupta", operator: "Royal Express", route: "Delhi to Jaipur", date: "2026-11-07", amount: 650, commission: 0, status: "CANCELLED" },
  { id: "b4", passenger: "Sneha Iyer", operator: "Royal Express", route: "Delhi to Jaipur", date: "2026-11-07", amount: 1300, commission: 0, status: "PENDING" },
];
const FILTERS = [["", "All"], ["CONFIRMED", "Confirmed"], ["PENDING", "Pending"], ["CANCELLED", "Cancelled"]];

export default function AdminBookings() {
  const { loading, live, data } = usePreview(PATH, SAMPLE, (d) => d?.bookings ?? d);
  const [status, setStatus] = useState("");
  if (loading) return <Loader label="Loading bookings" />;
  const rows = data.filter((b) => !status || b.status === status);
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Bookings</h1>
      {!live && <SampleBanner path={PATH} />}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([v, l]) => (
          <button key={l} onClick={() => setStatus(v)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === v ? "border-headlight bg-headlight/10 text-headlight" : "border-line text-mist hover:text-ink"}`}>{l}</button>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty icon={Ticket} title="No bookings" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-asphalt text-mist"><tr>{["Passenger", "Operator", "Route", "Date", "Amount", "Commission", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{b.passenger}</td>
                  <td className="px-4 py-3">{b.operator}</td>
                  <td className="px-4 py-3">{b.route}</td>
                  <td className="tnum px-4 py-3">{b.date}</td>
                  <td className="tnum px-4 py-3">{money(b.amount)}</td>
                  <td className="tnum px-4 py-3">{money(b.commission)}</td>
                  <td className="px-4 py-3"><StatusChip status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
