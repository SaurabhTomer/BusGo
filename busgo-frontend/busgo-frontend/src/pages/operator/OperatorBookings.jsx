import { Ticket } from "lucide-react";
import { money } from "../../lib/format.js";
import Empty from "../../components/Empty.jsx";
import Loader from "../../components/Loader.jsx";
import StatusChip from "../../components/StatusChip.jsx";
import { SampleBanner, usePreview } from "../../components/Preview.jsx";
import { list } from "./shared.jsx";

const PATH = "/operators/me/bookings";
const SAMPLE = [
  { id: "b1", passenger: "Aarav Sharma", route: "Lucknow to Delhi", date: "2026-11-05", seats: "A1, A2", amount: 1800, status: "CONFIRMED" },
  { id: "b2", passenger: "Priya Verma", route: "Lucknow to Delhi", date: "2026-11-05", seats: "B3", amount: 900, status: "CONFIRMED" },
  { id: "b3", passenger: "Rohan Gupta", route: "Delhi to Jaipur", date: "2026-11-07", seats: "C1", amount: 650, status: "CANCELLED" },
  { id: "b4", passenger: "Sneha Iyer", route: "Delhi to Jaipur", date: "2026-11-07", seats: "C4, C5", amount: 1300, status: "PENDING" },
];

export default function OperatorBookings() {
  const { loading, live, data } = usePreview(PATH, SAMPLE, (d) => list(d, "bookings"));
  if (loading) return <Loader label="Loading bookings" />;
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold">Bookings</h1>
      {!live && <SampleBanner path={PATH} />}
      {data.length === 0 ? (
        <Empty icon={Ticket} title="No bookings yet" text="Bookings on your trips show up here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-asphalt text-mist">
              <tr>{["Passenger", "Route", "Date", "Seats", "Amount", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{b.passenger}</td>
                  <td className="px-4 py-3">{b.route}</td>
                  <td className="tnum px-4 py-3">{b.date}</td>
                  <td className="px-4 py-3">{b.seats}</td>
                  <td className="tnum px-4 py-3">{money(b.amount)}</td>
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
