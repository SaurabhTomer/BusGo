import { api } from "./api.js";
import { openCheckout } from "./razorpay.js";

// cities ek baar mangwa ke yaad rakhte hain
let citiesCache = null;
export async function getCities() {
  if (!citiesCache) {
    const data = await api("/cities");
    citiesCache = data.cities ?? data;
  }
  return citiesCache;
}

// Ek booking ka payment: order banao -> Razorpay popup -> verify
// Idempotency-Key booking ke hisaab se fixed, to double click par dusra order nahi banta
// Return: { status: "paid", booking } ya { status: "dismissed" }
export async function payForBooking(booking, user) {
  const data = await api("/payments/create-order", {
    method: "POST",
    body: { bookingId: booking.id },
    headers: { "Idempotency-Key": `pay-${booking.id}` },
  });

  const seatCount = booking.seats?.length || 1;

  return new Promise((resolve, reject) => {
    openCheckout({
      keyId: data.keyId,
      order: data.order,
      user,
      description: `${seatCount} seat${seatCount > 1 ? "s" : ""}`,
      onSuccess: async (r) => {
        try {
          const done = await api("/payments/verify", {
            method: "POST",
            body: {
              razorpay_order_id: r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id,
              razorpay_signature: r.razorpay_signature,
            },
          });
          resolve({ status: "paid", booking: done.booking });
        } catch (e) {
          reject(e);
        }
      },
      onDismiss: () => resolve({ status: "dismissed" }),
    }).catch(reject);
  });
}
