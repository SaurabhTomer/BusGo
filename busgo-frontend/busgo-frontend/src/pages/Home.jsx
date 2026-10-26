import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownUp, Search } from "lucide-react";
import { getCities } from "../lib/pay.js";
import { todayStr } from "../lib/format.js";

// Hero ka seat map: kuch seats pehle se li hui, kuch hold, do tumhari (amber)
const taken = new Set([2, 5, 6, 11, 13, 18, 21, 22, 27, 30]);
const held = new Set([8, 9, 25]);
const yours = new Set([14, 15]);

function HeroSeats() {
  const rows = 8;
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit rounded-[2rem] border border-line bg-asphalt px-7 pb-7 pt-5">
      <div className="mb-5 flex items-center justify-between border-b border-dashed border-line pb-4 text-xs text-mist">
        <span>Tonight, 10:30 pm</span>
        <span className="tnum">22 of 32 seats left</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((c) => {
              const n = r * 4 + c + 1;
              const state = yours.has(n) ? "selected" : held.has(n) ? "held" : taken.has(n) ? "booked" : "available";
              return (
                <div key={n} className="flex items-center gap-2">
                  {c === 2 && <span className="w-6" />}
                  <span className={`seat ${state !== "available" ? "hero-seat" : ""}`} data-state={state} style={{ "--i": n }}>
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-mist">Seats change on every screen the moment someone books.</p>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState("");

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch(() => setError("Could not load cities. Is the backend running?"));
  }, []);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!from || !to) return setError("Choose where you are leaving from and going to.");
    if (from === to) return setError("Leaving from and going to cannot be the same city.");
    setError("");
    navigate(`/search?from=${from}&to=${to}&date=${date}`);
  };

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            Pick your seat.
            <br />
            Be on the road tonight.
          </h1>
          <p className="mt-5 max-w-md text-lg text-mist">
            See the real seat map, choose the window you want, and pay in a minute. Your seats stay yours for 5 minutes while you pay.
          </p>

          <form onSubmit={submit} className="mt-9 rounded-2xl border border-line bg-asphalt p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div>
                <label htmlFor="from" className="mb-1.5 block text-sm font-medium">
                  Leaving from
                </label>
                <select id="from" className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={swap} className="btn btn-ghost btn-sm mt-auto h-[2.7rem] self-end" aria-label="Swap cities">
                <ArrowDownUp size={16} className="sm:rotate-90" />
              </button>
              <div>
                <label htmlFor="to" className="mb-1.5 block text-sm font-medium">
                  Going to
                </label>
                <select id="to" className="input" value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="date" className="mb-1.5 block text-sm font-medium">
                  Travel date
                </label>
                <input id="date" type="date" className="input" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary mt-auto h-[2.7rem] px-6">
                <Search size={18} /> Search buses
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm text-taillight">
                {error}
              </p>
            )}
          </form>
        </div>

        <HeroSeats />
      </section>

      <section className="border-t border-line/70 bg-asphalt/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-bold">How your seat is kept</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              ["Choose seats", "Open a bus and tap up to 6 seats on the live map. Seats someone else is booking show up striped."],
              ["Pay within 5 minutes", "The moment you continue, your seats are held for you. The timer is on screen the whole time."],
              ["Get your ticket", "After payment the booking is confirmed. Cancel from My bookings and see the refund before you confirm."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="tnum grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line font-display font-bold text-headlight">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
