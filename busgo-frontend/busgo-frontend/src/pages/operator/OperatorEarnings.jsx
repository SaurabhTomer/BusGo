import { Banknote, Percent, Wallet } from "lucide-react";
import { money } from "../../lib/format.js";
import StatCard from "../../components/StatCard.jsx";
import Loader from "../../components/Loader.jsx";
import { SampleBanner, usePreview } from "../../components/Preview.jsx";
import { useOperator } from "./OperatorShell.jsx";

const PATH = "/operators/me/earnings";
const SAMPLE = {
  gross: 214500,
  commission: 21450,
  net: 193050,
  trips: [
    { id: "t1", route: "Lucknow to Delhi", date: "2026-10-28", seats: 34, gross: 30600 },
    { id: "t2", route: "Delhi to Jaipur", date: "2026-10-29", seats: 28, gross: 18200 },
    { id: "t3", route: "Lucknow to Kanpur", date: "2026-10-30", seats: 22, gross: 6600 },
  ],
};

export default function OperatorEarnings() {
  const { op } = useOperator();
  const { loading, live, data } = usePreview(PATH, SAMPLE);
  if (loading) return <Loader label="Loading earnings" />;
  const pct = op.commissionPct;
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold">Earnings</h1>
      {!live && <SampleBanner path={PATH} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Banknote} label="Gross sales" value={money(data.gross)} />
        <StatCard icon={Percent} label={`Commission (${pct}%)`} value={money(data.commission)} tone="text-taillight" />
        <StatCard icon={Wallet} label="Your earnings" value={money(data.net)} tone="text-reflector" />
      </div>
      <h2 className="mb-3 mt-8 font-display text-lg font-bold">By trip</h2>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-asphalt text-mist">
            <tr>{["Route", "Date", "Seats sold", "Gross", "You earn"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.trips.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{t.route}</td>
                <td className="tnum px-4 py-3">{t.date}</td>
                <td className="tnum px-4 py-3">{t.seats}</td>
                <td className="tnum px-4 py-3">{money(t.gross)}</td>
                <td className="tnum px-4 py-3 text-reflector">{money(Math.round(t.gross * (1 - pct / 100)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
