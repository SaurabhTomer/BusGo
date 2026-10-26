import { useMemo } from "react";

// Bus ka seat map. Row/col backend se aate hain; beech me galiyara (aisle).
// seats: [{id, seatNumber, row, col, status}], selected / mine: Set of seat ids
export default function SeatMap({ seats, selected, mine, flash, onToggle }) {
  const { rows, aisleAfter } = useMemo(() => {
    const byRow = new Map();
    let maxCol = 0;
    for (const s of seats) {
      if (!byRow.has(s.row)) byRow.set(s.row, []);
      byRow.get(s.row).push(s);
      maxCol = Math.max(maxCol, s.col);
    }
    const rows = [...byRow.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([row, list]) => ({ row, list: list.sort((a, b) => a.col - b.col) }));
    return { rows, aisleAfter: Math.floor(maxCol / 2) };
  }, [seats]);

  const stateOf = (s) => {
    if (mine?.has(s.id)) return "mine";
    if (selected?.has(s.id)) return "selected";
    if (s.status === "BOOKED") return "booked";
    if (s.status === "HELD") return "held";
    return "available";
  };

  return (
    <div className="mx-auto w-fit rounded-[2rem] border border-line bg-asphalt px-5 pb-6 pt-4 sm:px-8">
      {/* bus ka agla hissa */}
      <div className="mb-5 flex items-center justify-between border-b border-dashed border-line pb-4 text-xs text-mist">
        <span>Front of bus</span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-label="Driver">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="M3.5 10.5 9.8 11.4M20.5 10.5l-6.3.9M12 14.2V21" />
        </svg>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map(({ row, list }) => (
          <div key={row} className="flex items-center justify-center gap-2">
            {list.map((s, i) => {
              const state = stateOf(s);
              const clickable = state === "available" || state === "selected";
              return (
                <div key={s.id} className="flex items-center gap-2">
                  {i === aisleAfter && <span className="w-5 sm:w-8" aria-hidden="true" />}
                  <button
                    type="button"
                    className={`seat ${flash?.has(s.id) ? "seat-flash" : ""}`}
                    data-state={state}
                    disabled={!clickable}
                    onClick={() => onToggle(s)}
                    aria-label={`Seat ${s.seatNumber}, ${state}`}
                    aria-pressed={state === "selected"}
                  >
                    {s.seatNumber}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeatLegend() {
  const items = [
    ["available", "Free"],
    ["selected", "Your pick"],
    ["held", "Being booked"],
    ["booked", "Taken"],
  ];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-mist">
      {items.map(([state, label]) => (
        <li key={state} className="flex items-center gap-2">
          <span className="seat !h-6 !w-5 !text-[0]" data-state={state} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}
