import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Field from "../components/Field.jsx";
import OtpPhoneField from "../components/OtpPhoneField.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const ready = verified && form.name && form.email && form.password.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signup({ ...form, name: form.name.trim(), email: form.email.trim(), phone });
      toast.success("Account created. Welcome to BusGo.");
      navigate(location.state?.next || "/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-2 text-mist">Verify your mobile number first, then set a password.</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-line bg-asphalt p-6">
        <Field label="Full name" id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
        <Field label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        <OtpPhoneField phone={phone} onPhone={setPhone} verified={verified} onVerified={setVerified} />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={set("password")}
          required
        />
        <button className="btn btn-primary w-full" disabled={!ready || busy}>
          {busy ? "Creating account" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mist">
        Already have an account?{" "}
        <Link to="/login" state={location.state} className="font-semibold text-headlight hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
