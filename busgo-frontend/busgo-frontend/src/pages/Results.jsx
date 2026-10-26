import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, BusFront, SearchX } from "lucide-react";
import { api } from "../lib/api.js";
import { getCities } from "../lib/pay.js";
import { dateLong, duration, money, timeOf } from "../lib/format.js";
import Loader from "../components/Loader.jsx";
import Empty from "../components/Empty.jsx";

// date ko din ke hisaab se aage peeche (YYYY-MM-DD)
const shiftDate = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

function TripTicket({ trip, fromName, toName }) {
  const soldOut = trip.availableSeats === 0;

  // trip page par trip ki details chahiye (backend me public trip-detail API nahi hai)
  const remember = () => sessionStorage.setItem(`trip:${trip.id}`, JSON.stringify({ ...trip, fromName, toName }));

  return (
    <article className="ticket md:flex">
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-mist">{trip.route?.operator?.agencyName}</p>
          <p className="text-sm text-mist">
            {trip.bus?.name} ({trip.bus?.type === "SLEEPER" ? "Sleeper" : "Seater"})
          </p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="tnum font-display text-3xl font-bold">{timeOf(trip.departureTime)}</p>
            <p className="text-sm text-mist">{fromName}</p>
          </div>
          <div className="flex flex-1 items-center gap-2 text-xs text-mist">
            <span className="h-px flex-1 bg-line" />
            <span className="tnum whitespace-nowrap">{duration(trip.departureTime, trip.arrivalTime)}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="text-right">
            <p className="tnum font-display text-3xl font-bold">{timeOf(trip.arrivalTime)}</p>
            <p className="text-sm text-mist">{toName}</p>
          </div>
        </div>
      </div>

      <div className="ticket-cut ticket-side flex items-center justify-between gap-4 p-5 sm:p-6 md:w-60 md:flex-col md:items-stretch md:justify-center">
        <div className="md:text-center">
          <p className="tnum font-display text-3xl font-bold">{money(trip.price)}</p>
          <p className={`text-sm ${soldOut ? "text-taillight" : trip.availableSeats <= 5 ? "text-headlight" : "text-mist"}`}>
            {soldOut ? "No seats left" : `${trip.availableSeats} seats left`}
          </p>
        </div>
        {soldOut ? (
          <button className="btn btn-ghost" disabled>
            Sold out
          </button>
        ) : (
          <Link to={`/trip/${trip.id}`} state={{ trip: { ...trip, fromName, toName } }} onClick={remember} className="btn btn-primary">
            Select seats
          </Link>
        )}
      </div>
    </article>
  );
}

export default function Results() {
  const [params] = useSearchParams();
  const from = params.get("from");
  const to = params.get("to");
  const date = params.get("date");

  const [trips, setTrips] = useState(null);
  const [names, setNames] = useState({ from: "", to: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    setTrips(null);
    setError("");
    Promise.all([api(`/search/trips?from=${from}&to=${to}&date=${date}`), getCities()])
      .then(([data, cities]) => {
        setTrips(data.trips);
        setNames({
          from: cities.find((c) => c.id === from)?.name || "",
          to: cities.find((c) => c.id === to)?.name || "",
        });
      })
      .catch((e) => setError(e.message));
  }, [from, to, date]);

  const link = (d) => `/search?from=${from}&to=${to}&date=${d}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {names.from && names.to ? `${names.from} to ${names.to}` : "Buses"}
      </h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-mist">{date && dateLong(`${date}T12:00:00+05:30`)}</p>
        <div className="flex items-center gap-2">
          <Link to={link(shiftDate(date, -1))} className="btn btn-ghost btn-sm">
            <ChevronLeft size={16} /> Previous day
          </Link>
          <Link to={link(shiftDate(date, 1))} className="btn btn-ghost btn-sm">
            Next day <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {error && <Empty icon={SearchX} title="We could not search" text={error} action={<Link to="/" className="btn btn-ghost">Change search</Link>} />}
        {!error && trips === null && <Loader label="Finding buses" />}
        {trips?.length === 0 && (
          <Empty
            icon={BusFront}
            title="No buses on this day"
            text="Try the next day, or pick a different route."
            action={<Link to={link(shiftDate(date, 1))} className="btn btn-primary">Check next day</Link>}
          />
        )}
        {trips?.map((t) => (
          <TripTicket key={t.id} trip={t} fromName={names.from} toName={names.to} />
        ))}
      </div>
    </div>
  );
}
