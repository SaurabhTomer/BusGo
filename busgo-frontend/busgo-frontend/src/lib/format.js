// Dates India ke time (IST) me dikhate hain, chahe user ka computer kahin ka ho
const TZ = "Asia/Kolkata";

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

export const dateOf = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });

export const dateLong = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });

// "9h 30m"
export const duration = (fromIso, toIso) => {
  const mins = Math.round((new Date(toIso) - new Date(fromIso)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// aaj ki date YYYY-MM-DD (IST)
export const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

// <input type="datetime-local"> ki value ("2026-11-05T22:00") ko IST maan ke ISO banao
// export const localToIso = (local) => new Date(`${local}:00+05:30`).toISOString();

// export const localToIso = (local) => {
//   if (!local) return "";
//   const withSeconds = local.length === 16 ? `${local}:00` : local; // seconds nahi hain to jodo
//   const d = new Date(`${withSeconds}+05:30`);
//   return Number.isNaN(d.getTime()) ? "" : d.toISOString();
// };

// <input type="datetime-local"> ki value ko backend ke format me badlo
// "2026-11-05T21:00" -> "2026-11-05T21:00:00+05:30"
export const localToIso = (local) => {
  if (!local) return "";
  const withSeconds = local.length === 16 ? `${local}:00` : local.slice(0, 19); // seconds ensure
  if (Number.isNaN(new Date(`${withSeconds}+05:30`).getTime())) return "";
  return `${withSeconds}+05:30`;
};


// cancel pe kitna refund milega (backend ki policy ka andaza, dikhane ke liye)
export const refundPercent = (departureIso) => {
  const hours = (new Date(departureIso) - Date.now()) / 36e5;
  if (hours > 24) return 90;
  if (hours > 12) return 50;
  return 0;
};

// ISO time ko <input type="datetime-local"> ki value me badlo (IST)
// export const isoToLocal = (iso) => new Date(iso).toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16).replace(" ", "T");
export const isoToLocal = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16).replace(" ", "T");
};