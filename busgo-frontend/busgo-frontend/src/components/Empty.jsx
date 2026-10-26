// Khali screen ko agla kadam batao
export default function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="max-w-sm">
        {Icon && (
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-kerb text-mist">
            <Icon size={22} />
          </div>
        )}
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {text && <p className="mt-1.5 text-sm text-mist">{text}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
