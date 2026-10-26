import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Field from "../components/Field.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      const fallback = user.role === "OPERATOR" ? "/operator" : user.role === "ADMIN" ? "/admin" : "/";
      navigate(location.state?.next || fallback, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-mist">Log in to see your bookings and pick up where you left off.</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-line bg-asphalt p-6">
        <Field label="Email" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary w-full" disabled={busy || !email || !password}>
          {busy ? "Logging in" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-mist">
        New to BusGo?{" "}
        <Link to="/signup" state={location.state} className="font-semibold text-headlight hover:underline">
          Create an account
        </Link>
        . Running a bus company?{" "}
        <Link to="/operator/signup" className="font-semibold text-headlight hover:underline">
          List your buses
        </Link>
        .
      </p>
    </div>
  );
}
