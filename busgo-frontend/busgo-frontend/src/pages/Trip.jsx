import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Armchair } from "lucide-react";
import { api } from "../lib/api.js";
import { payForBooking } from "../lib/pay.js";
import { watchTrip } from "../lib/socket.js";
import { dateOf, duration, money, timeOf } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import SeatMap, { SeatLegend } from "../components/SeatMap.jsx";
import Countdown from "../components/Countdown.jsx";
import Loader from "../components/Loader.jsx";
import Empty from "../components/Empty.jsx";

const MAX_SEATS = 6; // backend ki bhi yahi limit hai

export default function Trip() {
  const { id: tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // trip ki details results page se aati hain (router state ya sessionStorage)
  const [trip] = useState(() => {
    if (location.state?.trip) return location.state.trip;
    try {
      return JSON.parse(sessionStorage.getItem(`trip:${tripId}`));
    } catch {
      return null;
    }
  });

  const [seats, setSeats] = useState([]);
  const [price, setPrice] = useState(trip?.price || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [flash, setFlash] = useState(new Set());
  const [stage, setStage] = useState("select"); // select | held | paying | done
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);

  // socket callback me latest value chahiye
  const selectedRef = useRef(selected);
  const mineRef = useRef(new Set());
  selectedRef.current = selected;
  mineRef.current = new Set((booking?.seats || []).map((s) => s.seatId));

  const load = useCallback(async () => {
    try {
      const data = await api(`/search/trips/${tripId}/seats`);
      setSeats(data.seats);
      setPrice(data.price);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  // live seat updates
  useEffect(() => {
    return watchTrip(tripId, ({ seatIds, status }) => {
      setSeats((prev) => prev.map((s) => (seatIds.includes(s.id) ? { ...s, status } : s)));

      // dusre ne meri chuni hui seat le li
      if (status !== "AVAILABLE") {
        const lost = seatIds.filter((sid) => selectedRef.current.has(sid) && !mineRef.current.has(sid));
        if (lost.length) {
          setSelected((prev) => {
            const next = new Set(prev);
            lost.forEach((sid) => next.delete(sid));
            return next;
          });
          toast.info("A seat you picked was just taken by someone else.");
        }
      }

      // jis seat ka status badla use ek second chamkao
      setFlash(new Set(seatIds));
      setTimeout(() => setFlash(new Set()), 900);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const toggle = (seat) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else if (next.size >= MAX_SEATS) toast.info(`You can book up to ${MAX_SEATS} seats at a time.`);
      else next.add(seat.id);
      return next;
    });
  };

  const seatLabel = (seatId) => seats.find((s) => s.id === seatId)?.seatNumber;
  const numbersOf = (ids) => ids.map(seatLabel).filter(Boolean).sort((a, b) => a - b);

  // ---------- 1) seats hold karo ----------
  const hold = async () => {
    if (!user) return navigate("/login", { state: { next: location.pathname } });
    if (user.role !== "USER") return toast.error("Log in with a customer account to book seats.");

    setBusy(true);
    try {
      const data = await api("/bookings", { method: "POST", body: { tripId, seatIds: [...selected] } });
      setBooking(data.booking);
      setStage("held");
      setSelected(new Set());
    } catch (e) {
      toast.error(e.status === 409 ? "One of those seats was just taken. Please pick again." : e.message);
      setSelected(new Set());
      load();
    } finally {
      setBusy(false);
    }
  };

  // ---------- 2) payment ----------
  const pay = async () => {
    setStage("paying");
    try {
      const result = await payForBooking(booking, user);
      if (result.status === "paid") {
        setBooking((b) => ({ ...b, ...result.booking, seats: b.seats }));
        setStage("done");
        toast.success("Payment received. Your booking is confirmed.");
      } else {
        setStage("held");
        toast.info("Payment window closed. Your seats are still held until the timer ends.");
      }
    } catch (e) {
      setStage("held");
      toast.error(e.message);
    }
  };

  // ---------- seats chhodo ----------
  const release = async () => {
    setBusy(true);
    try {
      await api(`/bookings/${booking.id}/cancel`, { method: "PATCH" });
      toast.success("Seats released.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBooking(null);
      setStage("select");
      setBusy(false);
      load();
    }
  };

  const onHoldEnd = () => {
    if (stage === "held") {
      toast.error("Your hold ran out and the seats were released.");
      setBooking(null);
      setStage("select");
      load();
    }
  };

  const picked = [...selected];
  const heldIds = (booking?.seats || []).map((s) => s.seatId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {trip?.fromName && trip?.toName ? `${trip.fromName} to ${trip.toName}` : "Choose your seats"}
        </h1>
        {trip && (
          <p className="tnum mt-2 text-mist">
            {dateOf(trip.departureTime)}, {timeOf(trip.departureTime)} to {timeOf(trip.arrivalTime)} ({duration(trip.departureTime, trip.arrivalTime)}) on{" "}
            {trip.bus?.name}
          </p>
        )}
      </header>

      {loading && <Loader label="Loading seat map" />}
      {error && !loading && (
        <Empty
          icon={Armchair}
          title="This bus is not available"
          text={error}
          action={
            <Link to="/" className="btn btn-ghost">
              Search again
            </Link>
          }
        />
      )}

      {!loading && !error && (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
          <section>
            <SeatMap
              seats={seats}
              selected={selected}
              mine={new Set(heldIds)}
              flash={flash}
              onToggle={stage === "select" ? toggle : () => {}}
            />
            <div className="mt-6">
              <SeatLegend />
            </div>
          </section>

          <aside className="rounded-2xl border border-line bg-asphalt p-5 sm:p-6 lg:sticky lg:top-24">
            {stage === "select" && (
              <>
                <h2 className="font-display text-xl font-bold">Your seats</h2>
                {picked.length === 0 ? (
                  <p className="mt-3 text-sm text-mist">Tap a free seat to pick it. You can choose up to {MAX_SEATS}.</p>
                ) : (
                  <>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {numbersOf(picked).map((n) => (
                        <span key={n} className="tnum rounded-lg bg-headlight px-2.5 py-1 text-sm font-bold text-[#1b1500]">
                          {n}
                        </span>
                      ))}
                    </div>
                    <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                      <div className="flex justify-between text-mist">
                        <dt>
                          {picked.length} x {money(price)}
                        </dt>
                        <dd className="tnum">{money(price * picked.length)}</dd>
                      </div>
                      <div className="flex justify-between font-display text-lg font-bold">
                        <dt>Total</dt>
                        <dd className="tnum">{money(price * picked.length)}</dd>
                      </div>
                    </dl>
                  </>
                )}
                <button className="btn btn-primary mt-5 w-full" disabled={picked.length === 0 || busy} onClick={hold}>
                  {busy ? "Holding seats" : user ? "Hold seats and pay" : "Log in to book"}
                </button>
                <p className="mt-3 text-xs text-mist">Seats are held for 5 minutes once you continue.</p>
              </>
            )}

            {(stage === "held" || stage === "paying") && booking && (
              <>
                <div className="flex items-center gap-2 text-sm text-mist">
                  <Clock size={16} /> Pay within
                </div>
                <Countdown until={booking.expiresAt} onEnd={onHoldEnd} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {numbersOf(heldIds).map((n) => (
                    <span key={n} className="tnum rounded-lg border border-reflector/50 bg-reflector/10 px-2.5 py-1 text-sm font-bold text-reflector">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex justify-between border-t border-line pt-4 font-display text-lg font-bold">
                  <span>Total</span>
                  <span className="tnum">{money(booking.totalAmount)}</span>
                </div>
                <button className="btn btn-primary mt-5 w-full" disabled={stage === "paying"} onClick={pay}>
                  {stage === "paying" ? "Opening payment" : `Pay ${money(booking.totalAmount)}`}
                </button>
                <button className="btn btn-ghost mt-2 w-full" disabled={busy || stage === "paying"} onClick={release}>
                  Release seats
                </button>
              </>
            )}

            {stage === "done" && booking && (
              <div className="text-center">
                <CheckCircle2 size={44} className="mx-auto text-reflector" />
                <h2 className="mt-3 font-display text-2xl font-bold">Booking confirmed</h2>
                <p className="mt-1 text-sm text-mist">
                  Seats {numbersOf(heldIds).join(", ")} on {trip?.fromName} to {trip?.toName}.
                </p>
                <p className="tnum mt-3 font-display text-lg font-bold">{money(booking.totalAmount)} paid</p>
                <Link to="/bookings" className="btn btn-primary mt-5 w-full">
                  View my bookings
                </Link>
                <Link to="/" className="btn btn-ghost mt-2 w-full">
                  Search another trip
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
