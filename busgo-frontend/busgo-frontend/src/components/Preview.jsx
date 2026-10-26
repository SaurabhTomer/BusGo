import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { api } from "../lib/api.js";

// Jin pages ki backend API abhi bani nahi hai unke liye.
// Pehle asli endpoint try karta hai. Mil gaya to asli data, nahi mila to sample data
// aur upar saaf likha hota hai ki ye sample hai. Baad me backend ban jaye to page apne aap asli ho jayega.
export function usePreview(path, sample, pick) {
  const [state, setState] = useState({ loading: true, live: false, data: sample });
  useEffect(() => {
    let off = false;
    api(path)
      .then((d) => !off && setState({ loading: false, live: true, data: pick ? pick(d) : d }))
      .catch(() => !off && setState({ loading: false, live: false, data: sample }));
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return state;
}

export function SampleBanner({ path }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-line bg-kerb/60 p-4 text-sm text-mist">
      <FlaskConical size={18} className="mt-0.5 shrink-0 text-headlight" />
      <p>
        <b className="text-ink">Sample data.</b> The backend endpoint <code className="rounded bg-night px-1.5 py-0.5 text-xs text-ink">GET /api{path}</code> is not built yet,
        so this page shows example numbers. It will switch to real data once the endpoint exists.
      </p>
    </div>
  );
}
