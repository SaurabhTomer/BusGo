import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { UploadButton } from "./shared.jsx";
import { useOperator } from "./OperatorShell.jsx";

function DocumentsView({ docs, reload }) {
  const toast = useToast();
  const [busy, setBusy] = useState("");

  const upload = async (type, file) => {
    setBusy(type);
    try {
      const body = new FormData();
      body.append("type", type);
      body.append("file", file);
      await api("/operators/me/documents", { method: "POST", body });
      toast.success(`${type} uploaded`);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const items = [
    ["PAN", "PAN card", "Photo or PDF of the PAN card of the agency owner."],
    ["GST", "GST certificate", "The GST registration certificate for your agency."],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(([type, title, text]) => {
        const done = docs.some((d) => d.type === type && !d.busId);
        return (
          <div key={type} className="rounded-2xl border border-line bg-asphalt p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold">{title}</h3>
              {done && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-reflector">
                  <CheckCircle2 size={16} /> Uploaded
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-mist">{text}</p>
            <div className="mt-4">
              <UploadButton label="Upload file" done={done} busy={busy === type} onFile={(f) => upload(type, f)} />
              <p className="mt-2 text-xs text-mist">JPG, PNG or PDF, up to 5 MB. Only our review team can open it.</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OperatorDocuments() {
  const { docs, loadDocs } = useOperator();
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Documents</h1>
      <p className="mb-6 mt-1 text-sm text-mist">We need your PAN and GST before approving your agency. RC of each bus is uploaded from the Buses page.</p>
      <DocumentsView docs={docs} reload={loadDocs} />
    </div>
  );
}
