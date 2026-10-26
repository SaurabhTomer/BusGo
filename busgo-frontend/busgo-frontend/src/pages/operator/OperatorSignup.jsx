import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Field from "../../components/Field.jsx";
import OtpPhoneField from "../../components/OtpPhoneField.jsx";

export default function OperatorSignup() {
  const { operatorSignup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", agencyName: "", gstNo: "", address: "" });
  const [phone, setPhone] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const ready = verified && Object.values(form).every(Boolean) && form.password.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await operatorSignup({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        agencyName: form.agencyName.trim(),
        gstNo: form.gstNo.trim().toUpperCase(),
        address: form.address.trim(),
        phone,
        contactPhone: contactPhone || phone,
      });
      toast.success("Application sent. Upload your documents to get approved.");
      navigate("/operator", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">List your buses on BusGo</h1>
      <p className="mt-2 max-w-lg text-mist">
        Create your operator account, then upload your PAN and GST certificate. Once we approve you, you can add buses and publish trips.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-line bg-asphalt p-6 sm:grid-cols-2">
        <Field label="Your name" id="name" value={form.name} onChange={set("name")} required />
        <Field label="Email" id="email" type="email" value={form.email} onChange={set("email")} required />
        <div className="sm:col-span-2">
          <OtpPhoneField phone={phone} onPhone={setPhone} verified={verified} onVerified={setVerified} />
        </div>
        <Field label="Password" id="password" type="password" hint="At least 8 characters." value={form.password} onChange={set("password")} required />
        <Field label="Agency name" id="agencyName" value={form.agencyName} onChange={set("agencyName")} required />
        <Field
          label="GST number"
          id="gstNo"
          maxLength={15}
          placeholder="09ABCDE1234F1Z5"
          value={form.gstNo}
          onChange={(e) => setForm((f) => ({ ...f, gstNo: e.target.value.toUpperCase() }))}
          required
        />
        <Field
          label="Agency contact number"
          id="contactPhone"
          inputMode="numeric"
          maxLength={10}
          hint="Leave empty to use your mobile number."
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ""))}
        />
        <div className="sm:col-span-2">
          <Field label="Office address" id="address" value={form.address} onChange={set("address")} required />
        </div>
        <button className="btn btn-primary sm:col-span-2" disabled={!ready || busy}>
          {busy ? "Sending application" : "Apply as operator"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mist">
        Already an operator?{" "}
        <Link to="/login" className="font-semibold text-headlight hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
