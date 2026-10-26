import { useEffect, useState } from "react";

// until = ISO time. Khatam hone par onEnd() ek baar chalta hai
export default function Countdown({ until, onEnd }) {
  const left = () => Math.max(0, Math.floor((new Date(until) - Date.now()) / 1000));
  const [secs, setSecs] = useState(left);

  useEffect(() => {
    setSecs(left());
    const id = setInterval(() => {
      const s = left();
      setSecs(s);
      if (s === 0) {
        clearInterval(id);
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);

  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return (
    <span className={`tnum font-display text-2xl font-bold ${secs <= 60 ? "text-taillight" : "text-headlight"}`}>
      {m}:{s}
    </span>
  );
}
