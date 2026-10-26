import { useCallback, useEffect, useState } from "react";
import { Building2, ExternalLink } from "lucide-react";
import { api } from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Loader from "../../components/Loader.jsx";
import Empty from "../../components/Empty.jsx";
import Modal from "../../components/Modal.jsx";
import StatusChip from "../../components/StatusChip.jsx";

const FILTERS = [["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["SUSPENDED", "Suspended"], ["", "All"]];
const arr = (d, k) => d?.[k] ?? (Array.isArray(d) ? d : []);

// ek operator ki detail, documents aur approve / reject / suspend
function OperatorDetail({ id, onClose, onChanged }) {
  const toast = useToast();
  const [op, setOp] = useState(null);
  const [docs, setDocs] = useState(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/admin/operators/${id}`).then((d) => setOp(d.operator ?? d)).catch((e) => toast.error(e.message));
    // documents ke links 10 minute ke liye valid hote hain
    api(`/admin/operators/${id}/documents`).then((d) => setDocs(arr(d, "documents"))).catch(() => setDocs([]));
  }, [id, toast]);

  const act = async (action, body, done) => {
    setBusy(true);
    try {
      await api(`/admin/operators/${id}/${action}`, { method: "PATCH", body });
      toast.success(done);
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const docUrl = (d) => d.url || d.fileUrl || d.link;

  return (
    <Modal open title={op ? op.agencyName : "Operator"} onClose={onClose}>
      {!op ? (
        <Loader label="Loading" />
      ) : (
        <div className="grid gap-4 text-sm">
          <div className="flex items-center justify-between">
            <StatusChip status={op.status} kind="review" />
            <span className="text-mist">Commission {op.commissionPct}%</span>
          </div>
          <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5">
            {[["Owner", op.user?.name], ["Email", op.user?.email], ["Phone", op.user?.phone], ["Agency", op.agencyName]].map(([k, v]) => v && (
              <div key={k} className="contents"><dt className="text-mist">{k}</dt><dd className="break-all">{v}</dd></div>
            ))}
          </dl>
          {op.rejectionReason && <p className="rounded-lg bg-taillight/10 p-3 text-taillight">Reason: {op.rejectionReason}</p>}

          <div>
            <p className="mb-2 font-semibold">Documents</p>
            {docs === null ? (
              <p className="text-mist">Loading documents</p>
            ) : docs.length === 0 ? (
              <p className="text-mist">No documents uploaded yet. Approval needs PAN and GST.</p>
            ) : (
              <ul className="grid gap-2">
                {docs.map((d, i) => (
                  <li key={d.id || i} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <span>{d.type}{d.busId ? " (bus RC)" : ""}</span>
                    {docUrl(d) && (
                      <a href={docUrl(d)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-headlight hover:underline">
                        Open <ExternalLink size={14} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {rejecting ? (
            <div className="grid gap-3">
              <textarea className="input min-h-24" placeholder="Why is this application rejected? The operator will see this." value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-3">
                <button className="btn btn-danger" disabled={busy || reason.trim().length < 3} onClick={() => act("reject", { reason: reason.trim() }, "Operator rejected")}>Confirm reject</button>
                <button className="btn btn-ghost" onClick={() => setRejecting(false)}>Back</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(op.status === "PENDING" || op.status === "SUSPENDED" || op.status === "REJECTED") && (
                <button className="btn btn-primary" disabled={busy} onClick={() => act("approve", undefined, "Operator approved")}>Approve</button>
              )}
              {op.status === "PENDING" && <button className="btn btn-danger" onClick={() => setRejecting(true)}>Reject</button>}
              {op.status === "APPROVED" && <button className="btn btn-danger" disabled={busy} onClick={() => act("suspend", undefined, "Operator suspended")}>Suspend</button>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminOperators() {
  const toast = useToast();
  const [status, setStatus] = useState("PENDING");
  const [ops, setOps] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    setOps(null);
    api(`/admin/operators${status ? `?status=${status}` : ""}`).then((d) => setOps(arr(d, "operators"))).catch((e) => { toast.error(e.message); setOps([]); });
  }, [status, toast]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Operators</h1>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([v, label]) => (
          <button key={label} onClick={() => setStatus(v)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === v ? "border-headlight bg-headlight/10 text-headlight" : "border-line text-mist hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>

      {ops === null ? (
        <Loader label="Loading operators" />
      ) : ops.length === 0 ? (
        <Empty icon={Building2} title="No operators here" text="Nothing matches this filter right now." />
      ) : (
        <div className="grid gap-3">
          {ops.map((o) => (
            <button key={o.id} onClick={() => setOpenId(o.id)} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-asphalt p-5 text-left transition-colors hover:border-headlight/50">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{o.agencyName}</p>
                <p className="truncate text-sm text-mist">{o.user?.email || o.user?.name || ""}</p>
              </div>
              <StatusChip status={o.status} kind="review" />
            </button>
          ))}
        </div>
      )}
      {openId && <OperatorDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}
