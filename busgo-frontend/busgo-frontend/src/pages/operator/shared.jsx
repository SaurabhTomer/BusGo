import { useRef } from "react";
import { FileUp } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";

// API kabhi { buses: [...] } deti hai kabhi seedha array, dono chalega
export const list = (data, key) => data?.[key] ?? (Array.isArray(data) ? data : []);

// ---------- ek file chuno aur upload karo ----------
export function UploadButton({ label, onFile, busy, done }) {
  const ref = useRef(null);
  const toast = useToast();
  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File is too large. Maximum is 5 MB.");
    onFile(file);
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={pick} />
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => ref.current.click()}>
        <FileUp size={15} /> {done ? "Replace" : label}
      </button>
    </>
  );
}
