const styles = {
  CONFIRMED: ["Confirmed", "text-reflector border-reflector/40 bg-reflector/10"],
  APPROVED: ["Approved", "text-reflector border-reflector/40 bg-reflector/10"],
  PENDING: ["Awaiting payment", "text-headlight border-headlight/40 bg-headlight/10"],
  CANCELLED: ["Cancelled", "text-mist border-line bg-kerb"],
  EXPIRED: ["Expired", "text-mist border-line bg-kerb"],
  REJECTED: ["Rejected", "text-taillight border-taillight/40 bg-taillight/10"],
  SUSPENDED: ["Suspended", "text-taillight border-taillight/40 bg-taillight/10"],
  SCHEDULED: ["Scheduled", "text-reflector border-reflector/40 bg-reflector/10"],
  COMPLETED: ["Completed", "text-mist border-line bg-kerb"],
};

// kind="review": operator ke PENDING ko "In review" dikhao
export default function StatusChip({ status, kind }) {
  let [label, cls] = styles[status] || [status, "text-mist border-line bg-kerb"];
  if (kind === "review" && status === "PENDING") label = "In review";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
