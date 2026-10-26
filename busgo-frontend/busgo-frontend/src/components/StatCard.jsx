// Ek number aur uska naam
export default function StatCard({ icon: Icon, label, value, tone = "text-headlight", hint }) {
  return (
    <div className="rounded-2xl border border-line bg-asphalt p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mist">{label}</p>
        {Icon && <Icon size={18} className={tone} />}
      </div>
      <p className="tnum mt-2 font-display text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}
