import { Building2, LayoutDashboard, MapPin, Ticket, Users } from "lucide-react";
import PanelShell from "../../components/PanelShell.jsx";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/operators", label: "Operators", icon: Building2 },
  { to: "/admin/cities", label: "Cities", icon: MapPin },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/bookings", label: "Bookings", icon: Ticket },
];

export default function AdminShell() {
  return <PanelShell title="BusGo Admin" subtitle="Control panel" items={items} />;
}
