// Razorpay ka checkout popup. Script pehli baar kholte waqt load hoti hai.
let loading = null;

const loadScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }
  return loading;
};

// order = { id, amount, currency } (backend se), onSuccess(response), onDismiss()
export async function openCheckout({ keyId, order, user, description, onSuccess, onDismiss }) {
  const ok = await loadScript();
  if (!ok) throw new Error("Could not load the payment window. Check your internet and try again");

  const rzp = new window.Razorpay({
    key: keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.id,
    name: "BusGo",
    description,
    prefill: { name: user?.name, email: user?.email, contact: user?.phone },
    theme: { color: "#ffc857" },
    handler: onSuccess, // { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    modal: { ondismiss: onDismiss },
  });
  rzp.open();
}
