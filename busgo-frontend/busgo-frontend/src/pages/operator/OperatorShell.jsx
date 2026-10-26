import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BusFront, FileText, IndianRupee, LayoutDashboard, Route as RouteIcon, ShieldAlert, Ticket } from "lucide-react";
import { api } from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PanelShell from "../../components/PanelShell.jsx";
import Loader from "../../components/Loader.jsx";
import Empty from "../../components/Empty.jsx";
import StatusChip from "../../components/StatusChip.jsx";
import { list } from "./shared.jsx";

const Ctx = createContext(null);
// baaki operator pages isse operator, docs, approved le sakte hain
export const useOperator = () => useContext(Ctx);

const items = [
  { to: "/operator", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/operator/buses", label: "Buses", icon: BusFront },
  { to: "/operator/trips", label: "Trips", icon: RouteIcon },
  { to: "/operator/bookings", label: "Bookings", icon: Ticket },
  { to: "/operator/earnings", label: "Earnings", icon: IndianRupee },
  { to: "/operator/documents", label: "Documents", icon: FileText },
];

export default function OperatorShell() {
  const toast = useToast();
  const [op, setOp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");

  const loadDocs = useCallback(() => api("/operators/me/documents").then((d) => setDocs(list(d, "documents"))).catch(() => {}), []);
  useEffect(() => {
    api("/operators/me").then((d) => setOp(d.operator ?? d)).catch((e) => setError(e.message));
    loadDocs();
  }, [loadDocs]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-14"><Empty title="We could not load your operator account" text={error} /></div>;
  if (!op) return <Loader label="Loading your dashboard" />;

  const approved = op.status === "APPROVED";
  const missing = ["PAN", "GST"].filter((t) => !docs.some((d) => d.type === t && !d.busId));

  // Re-apply ki API abhi backend me nahi hai, isliye try karke saaf message dikhate hain
   // Re-apply: POST /operators/me/reapply
  const reapply = async () => {
    try {
      await api("/operators/me/reapply", { method: "POST" });
      toast.success("Application sent for review again");
      setOp({ ...op, status: "PENDING", rejectionReason: null });
    } catch (e) {
      // 404 = route nahi mila, baaki sab me server ka asli message dikhao
      toast.error(e.status === 404 ? "Re-apply route is missing on the server. Restart the backend." : e.message);
    }
  };

  const banner = {
    PENDING: missing.length
      ? `Your application is waiting for documents. Upload your ${missing.join(" and ")} so we can review it.`
      : "Your documents are in. We are reviewing your application and will approve it soon.",
    REJECTED: `Your application was not approved.${op.rejectionReason ? ` Reason: ${op.rejectionReason}` : ""}`,
    SUSPENDED: "Your account is suspended. Your trips are hidden from search. Contact support to get it restored.",
  }[op.status];

  const side = (
    <div className="mt-5 hidden rounded-xl border border-line bg-asphalt p-3 lg:block">
      <StatusChip status={op.status} kind="review" />
      <p className="mt-2 text-xs text-mist">Commission {op.commissionPct}% per booking</p>
    </div>
  );

  return (
    <Ctx.Provider value={{ op, docs, loadDocs, approved, missing }}>
      <PanelShell title={op.agencyName} subtitle="Operator panel" items={items} side={side} />
      {banner && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-headlight/30 bg-night/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm sm:px-6">
            <ShieldAlert size={18} className="shrink-0 text-headlight" />
            <p className="flex-1">{banner}</p>
            {op.status === "REJECTED" && (
              <button className="btn btn-primary btn-sm shrink-0" onClick={reapply}>Re-apply</button>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
