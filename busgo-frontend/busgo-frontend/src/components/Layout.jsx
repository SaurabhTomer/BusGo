import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Ticket, LayoutDashboard, ShieldCheck, UserRound } from "lucide-react";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-kerb text-ink" : "text-mist hover:text-ink"
  }`;

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-night/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="BusGo home">
            <Logo />
          </Link>

          <nav className="flex items-center gap-1">
            {user?.role === "USER" && (
              <NavLink to="/bookings" className={navClass}>
                <Ticket size={16} />
                <span className="hidden sm:inline">My bookings</span>
              </NavLink>
            )}
            {user?.role === "OPERATOR" && (
              <NavLink to="/operator" className={navClass}>
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </NavLink>
            )}

            {user?.role === "ADMIN" && (
              <NavLink to="/admin" className={navClass}>
                <ShieldCheck size={16} />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/account" className={navClass} aria-label="My account">
                <UserRound size={16} />
                <span className="hidden sm:inline">Account</span>
              </NavLink>
            )}

            {!loading && !user && (
              <>
                <Link to="/operator/signup" className="hidden px-3 py-2 text-sm font-medium text-mist hover:text-ink md:inline">
                  List your buses
                </Link>
                <Link to="/login" className="btn btn-ghost btn-sm ml-1">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}

            {user && (
              <div className="ml-2 flex items-center gap-2 border-l border-line pl-3">
                <span className="hidden max-w-[10rem] truncate text-sm text-mist sm:block">{user.name}</span>
                <button onClick={onLogout} className="btn btn-ghost btn-sm" aria-label="Log out">
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-mist sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo className="opacity-80" />
          <p>Seats you pick are held for 5 minutes while you pay. Payments run in Razorpay test mode.</p>
        </div>
      </footer>
    </div>
  );
}
