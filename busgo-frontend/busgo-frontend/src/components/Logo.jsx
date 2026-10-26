// BusGo ka logo. Poora logo sirf isi file me hai.
// Naya logo chahiye to neeche sirf VARIANT ka number badlo (1 se 6).
//   1 bus ka saamne ka hissa   2 seat   3 ticket   4 letter B   5 road   6 steering wheel wala o
const VARIANT = 1;

const A = "#ffc857"; // headlight
const N = "#0e1324"; // night
const R = "#ff6b5e"; // taillight

const Wheel = ({ size, color = A }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
    <circle cx="16" cy="16" r="11.5" />
    <circle cx="16" cy="16" r="3" fill={color} stroke="none" />
    <path d="M5.2 13.4 13 15M26.8 13.4 19 15M16 19.2V27" />
  </svg>
);

const marks = {
  1: (s) => (
    <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="5" width="24" height="18" rx="5" fill={A} />
      <rect x="8" y="9" width="16" height="6" rx="1.8" fill={N} />
      <circle cx="10.5" cy="19" r="1.8" fill={N} />
      <circle cx="21.5" cy="19" r="1.8" fill={N} />
      <rect x="8" y="25" width="5" height="3" rx="1.2" fill={A} />
      <rect x="19" y="25" width="5" height="3" rx="1.2" fill={A} />
    </svg>
  ),
  2: (s) => (
    <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="8" fill={A} />
      <rect x="11" y="6.5" width="10" height="4.5" rx="2.2" fill={N} />
      <rect x="8" y="12" width="16" height="12" rx="4" fill={N} />
      <rect x="10" y="25.5" width="12" height="2" rx="1" fill={N} />
    </svg>
  ),
  3: (s) => (
    <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <mask id="busgo-ticket">
          <rect width="32" height="32" fill="#fff" />
          <circle cx="2.5" cy="16" r="3.6" fill="#000" />
          <circle cx="29.5" cy="16" r="3.6" fill="#000" />
        </mask>
      </defs>
      <rect x="1" y="6" width="30" height="20" rx="5" fill={A} mask="url(#busgo-ticket)" />
      <circle cx="9" cy="16" r="2.4" fill={N} />
      <path d="M13.5 16h5" stroke={N} strokeWidth="2" strokeDasharray="1.6 2.2" strokeLinecap="round" />
      <path d="M23 11.8a4.2 4.2 0 0 1 4.2 4.2c0 3-4.2 6.2-4.2 6.2s-4.2-3.2-4.2-6.2A4.2 4.2 0 0 1 23 11.8z" fill={N} />
      <circle cx="23" cy="16" r="1.5" fill={A} />
    </svg>
  ),
  4: (s) => (
    <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="8" fill={N} stroke="#313a5c" strokeWidth="1.5" />
      <path fillRule="evenodd" fill={A} d="M9 6H17.5C21.2 6 23.6 8 23.6 11C23.6 13 22.6 14.4 21 15.2C23.2 15.9 24.6 17.6 24.6 20C24.6 23.4 22 26 18 26H9ZM13.4 9.7V13.6H17C18.5 13.6 19.3 12.8 19.3 11.6C19.3 10.5 18.5 9.7 17 9.7ZM13.4 17.2V22.3H17.6C19.1 22.3 20.1 21.4 20.1 19.7C20.1 18.1 19.1 17.2 17.6 17.2Z" />
      <circle cx="25.5" cy="25.5" r="2.3" fill={R} />
    </svg>
  ),
  5: (s) => (
    <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="8" fill={A} />
      <path d="M6.5 28.5 13.4 5.5H18.6L25.5 28.5Z" fill={N} />
      <rect x="15.1" y="21.5" width="1.8" height="4.8" rx=".6" fill={A} />
      <rect x="15.3" y="14.6" width="1.4" height="3.8" rx=".5" fill={A} />
      <rect x="15.5" y="9.2" width="1" height="2.6" rx=".4" fill={A} />
    </svg>
  ),
};

export default function Logo({ className = "" }) {
  // variant 6: koi icon nahi, bas "BusG" aur steering wheel wala o
  if (VARIANT === 6) {
    return (
      <span className={`inline-flex items-center font-display text-xl font-extrabold tracking-tight ${className}`}>
        BusG<span className="ml-px -translate-y-px"><Wheel size={20} /></span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {marks[VARIANT](30)}
      <span className="font-display text-xl font-extrabold tracking-tight">BusGo</span>
    </span>
  );
}
