import { useState } from "react";
import { KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Field from "../components/Field.jsx";

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
    <Icon size={18} className="text-mist" />
    <span className="w-20 text-sm text-mist">{label}</span>
    <span className="min-w-0 flex-1 truncate font-medium">{value || "Not added"}</span>
  </div>
);

// Profile dikhata hai (GET /auth/me se). Password badalne ki API backend me abhi nahi hai,
// isliye form try karta hai aur nahi chala to saaf message deta hai.
export default function Account() {
  const { user } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: pw.current, newPassword: pw.next } });
      toast.success("Password changed");
      setPw({ current: "", next: "" });
    } catch (err) {
      toast.info(err.status === 404 ? "Changing password is not available on the server yet." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">My account</h1>

      <div className="mt-6 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-headlight font-display text-2xl font-extrabold text-night">
          {(user.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-display text-xl font-bold">{user.name}</p>
          <p className="text-sm text-mist">{user.role === "USER" ? "Passenger" : user.role === "OPERATOR" ? "Operator" : "Admin"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-asphalt px-5 py-2">
        <Row icon={UserRound} label="Name" value={user.name} />
        <Row icon={Mail} label="Email" value={user.email} />
        <Row icon={Phone} label="Phone" value={user.phone} />
      </div>

      <form onSubmit={changePassword} className="mt-6 grid gap-4 rounded-2xl border border-line bg-asphalt p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><KeyRound size={18} /> Change password</h2>
        <Field label="Current password" id="cp" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
        <Field label="New password" id="np" type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
        <button className="btn btn-primary w-fit" disabled={busy || pw.next.length < 8}>{busy ? "Saving" : "Update password"}</button>
      </form>
    </div>
  );
}
