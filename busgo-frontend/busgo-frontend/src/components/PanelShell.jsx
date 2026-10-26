import { NavLink, Outlet } from "react-router-dom";

// Operator aur admin dono ka sidebar wala layout.
// items = [{ to, label, icon, end }]
export default function PanelShell({ title, subtitle, items, side }) {
  const cls = ({ isActive }) =>
    `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "bg-kerb text-ink" : "text-mist hover:bg-kerb/50 hover:text-ink"
    }`;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-56 lg:shrink-0">
        <p className="font-display text-lg font-extrabold leading-tight">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-mist">{subtitle}</p>}
        <nav className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={cls}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        {side}
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}
