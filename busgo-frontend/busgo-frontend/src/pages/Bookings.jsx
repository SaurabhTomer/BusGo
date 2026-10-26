import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";
import { api } from "../lib/api.js";
import { payForBooking } from "../lib/pay.js";
import { dateOf, duration, money, refundPercent, timeOf } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";
import Empty from "../components/Empty.jsx";
import Modal from "../components/Modal.jsx";
import StatusChip from "../components/StatusChip.jsx";
import Countdown from "../components/Countdown.jsx";

function BookingTicket({ b, onPay, onCancel, busy }) {
  const seatNos = (b.seats || []).map((s) => s.seat?.seatNumber).filter(Boolean).join(", ");
  const live = b.status === "PENDING" && new Date(b.expiresAt) > new Date();
  const upcoming = new Date(b.trip.departureTime) > new Date();
  const canCancel = (b.status === "CONFIRMED" || live) && upcoming;
  // refund ki detail (payment ke andar refunds)
  const payments = b.payments || [];
  const refund = payments.flatMap((p) => p.refunds || [])[0];
  const wasPaid = payments.some((p) => p.status === "PAID" || p.status === "REFUNDED");
  const refundLabel = { PENDING: "Refund in progress", PROCESSED: "Refunded", FAILED: "Refund failed, contact support" };


  return (
    <article className="ticket md:flex">
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={live || b.status !== "PENDING" ? b.status : "EXPIRED"} />
          <p className="tnum text-sm text-mist">{dateOf(b.trip.departureTime)}</p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-bold">
          {b.trip.route.sourceCity.name} to {b.trip.route.destinationCity.name}
        </h3>
        <p className="tnum mt-1 text-sm text-mist">
          {timeOf(b.trip.departureTime)} to {timeOf(b.trip.arrivalTime)} ({duration(b.trip.departureTime, b.trip.arrivalTime)})
        </p>
        <p className="mt-3 text-sm">
          Seats <span className="tnum font-semibold">{seatNos || "released"}</span>
        </p>
      </div>

      <div className="ticket-cut ticket-side flex flex-col justify-center gap-3 p-5 sm:p-6 md:w-64">
        <div>
          <p className="tnum font-display text-2xl font-bold">{money(b.totalAmount)}</p>
          {b.status === "CONFIRMED" && <p className="text-xs text-mist">Booking ID {b.id.slice(0, 8)}</p>}
                    {b.status === "CANCELLED" && refund && (
            <p className={`mt-1 text-sm font-semibold ${refund.status === "PROCESSED" ? "text-reflector" : refund.status === "FAILED" ? "text-taillight" : "text-headlight"}`}>
              {refundLabel[refund.status]}: {money(refund.amount)}
            </p>
          )}
          {b.status === "CANCELLED" && wasPaid && !refund && (
            <p className="mt-1 text-sm text-mist">No refund (cancelled within 12 hours of departure)</p>
          )}
          {live && (
            <p className="flex items-center gap-2 text-sm text-mist">
              Pay within <Countdown until={b.expiresAt} />
            </p>
          )}
        </div>
        {live && (
          <button className="btn btn-primary" disabled={busy} onClick={() => onPay(b)}>
            Pay now
          </button>
        )}
        {canCancel && (
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => onCancel(b)}>
            {live ? "Release seats" : "Cancel booking"}
          </button>
        )}
      </div>
    </article>
  );
}

export default function Bookings() {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // jis booking ko cancel karna hai

  const load = useCallback(async () => {
    try {
      const data = await api("/bookings");
      setList(data.bookings);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pay = async (b) => {
    setBusy(true);
    try {
      const r = await payForBooking(b, user);
      if (r.status === "paid") toast.success("Payment received. Your booking is confirmed.");
      else toast.info("Payment window closed. Your seats are still held until the timer ends.");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const data = await api(`/bookings/${confirm.id}/cancel`, { method: "PATCH" });
      toast.success(data.message);
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const now = new Date();
  const upcoming = (list || []).filter((b) => (b.status === "CONFIRMED" || (b.status === "PENDING" && new Date(b.expiresAt) > now)) && new Date(b.trip.departureTime) > now);
  const history = (list || []).filter((b) => !upcoming.includes(b));

  // cancel popup me refund kitna milega
  const pct = confirm?.status === "CONFIRMED" ? refundPercent(confirm.trip.departureTime) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">My bookings</h1>

      <div className="mt-8 space-y-10">
        {error && <Empty title="We could not load your bookings" text={error} />}
        {!error && list === null && <Loader label="Loading your bookings" />}
        {list?.length === 0 && (
          <Empty
            icon={Ticket}
            title="No bookings yet"
            text="Search a route and pick your seats. Your tickets will show up here."
            action={<Link to="/" className="btn btn-primary">Find a bus</Link>}
          />
        )}

        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl font-bold">Upcoming</h2>
            <div className="flex flex-col gap-4">
              {upcoming.map((b) => (
                <BookingTicket key={b.id} b={b} busy={busy} onPay={pay} onCancel={setConfirm} />
              ))}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl font-bold">Past and cancelled</h2>
            <div className="flex flex-col gap-4 opacity-80">
              {history.map((b) => (
                <BookingTicket key={b.id} b={b} busy={busy} onPay={pay} onCancel={setConfirm} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal open={!!confirm} title={confirm?.status === "CONFIRMED" ? "Cancel this booking?" : "Release these seats?"} onClose={() => setConfirm(null)}>
        {confirm?.status === "CONFIRMED" ? (
          <p className="text-sm text-mist">
            {pct > 0 ? (
              <>
                You will get <span className="tnum font-semibold text-ink">{pct}%</span> back,{" "}
                <span className="tnum font-semibold text-ink">{money(Math.floor((confirm.totalAmount * pct) / 100))}</span>, because the bus leaves
                in {pct === 90 ? "more than 24 hours" : "12 to 24 hours"}.
              </>
            ) : (
              <>The bus leaves in under 12 hours, so this booking is not refundable. Your seats will be released.</>
            )}
          </p>
        ) : (
          <p className="text-sm text-mist">You have not paid yet, so nothing is charged. The seats go back on sale.</p>
        )}
        <div className="mt-6 flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={() => setConfirm(null)}>
            Keep booking
          </button>
          <button className="btn btn-danger flex-1" disabled={busy} onClick={cancel}>
            {busy ? "Working" : confirm?.status === "CONFIRMED" ? "Cancel booking" : "Release seats"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
