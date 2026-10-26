import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { api } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";

// Phone number + "Send OTP" + OTP + "Verify". Verify hone par onVerified(true).
// Backend demo mode me response me `otp` bhejta hai, to wahi dikha aur bhar dete hain.
export default function OtpPhoneField({ phone, onPhone, verified, onVerified }) {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0); // resend ke liye seconds
  const [demoOtp, setDemoOtp] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  const send = async () => {
    setBusy(true);
    try {
      const data = await api("/auth/send-otp", { method: "POST", body: { phone } });
      setSent(true);
      setWait(60);
      if (data.otp) {
        setDemoOtp(String(data.otp));
        setOtp(String(data.otp));
      }
      toast.success("OTP sent to +91 " + phone);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await api("/auth/verify-otp", { method: "POST", body: { phone, otp } });
      onVerified(true);
      toast.success("Phone number verified");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
        Mobile number
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mist">+91</span>
          <input
            id="phone"
            className="input !pl-11"
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
            value={phone}
            disabled={verified}
            onChange={(e) => {
              onPhone(e.target.value.replace(/\D/g, ""));
              onVerified(false);
              setSent(false);
            }}
          />
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-reflector">
            <BadgeCheck size={18} /> Verified
          </span>
        ) : (
          <button type="button" className="btn btn-ghost" disabled={!validPhone || busy || wait > 0} onClick={send}>
            {wait > 0 ? `Resend in ${wait}s` : sent ? "Resend OTP" : "Send OTP"}
          </button>
        )}
      </div>

      {sent && !verified && (
        <div className="mt-3">
          <label htmlFor="otp" className="mb-1.5 block text-sm font-medium">
            6 digit OTP
          </label>
          <div className="flex gap-2">
            <input
              id="otp"
              className="input tnum tracking-[0.3em]"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <button type="button" className="btn btn-primary" disabled={otp.length !== 6 || busy} onClick={verify}>
              Verify
            </button>
          </div>
          {demoOtp && <p className="mt-2 text-xs text-mist">Demo mode: OTP {demoOtp} is filled in for you.</p>}
        </div>
      )}
    </div>
  );
}
