export default function Loader({ label = "Loading" }) {
  return (
    <div className="grid place-items-center py-24" role="status">
      <div className="flex items-center gap-3 text-mist">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-headlight" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
