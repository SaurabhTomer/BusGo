// Label + input ek saath
export default function Field({ label, id, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input id={id} className="input" {...props} />
      {hint && <p className="mt-1.5 text-xs text-mist">{hint}</p>}
    </div>
  );
}
