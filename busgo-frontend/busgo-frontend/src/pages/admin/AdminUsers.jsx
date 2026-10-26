import { useState } from "react";
import { Search, Users } from "lucide-react";
import Empty from "../../components/Empty.jsx";
import Loader from "../../components/Loader.jsx";
import { SampleBanner, usePreview } from "../../components/Preview.jsx";

const PATH = "/admin/users";
const SAMPLE = [
  { id: "u1", name: "Aarav Sharma", email: "aarav@example.com", phone: "9876543210", role: "USER", joined: "2026-09-02" },
  { id: "u2", name: "Priya Verma", email: "priya@example.com", phone: "9811122233", role: "USER", joined: "2026-09-14" },
  { id: "u3", name: "Shivneri Travels", email: "ops@shivneri.example", phone: "9822200011", role: "OPERATOR", joined: "2026-09-20" },
];

export default function AdminUsers() {
  const { loading, live, data } = usePreview(PATH, SAMPLE, (d) => d?.users ?? d);
  const [q, setQ] = useState("");
  if (loading) return <Loader label="Loading users" />;
  const rows = data.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Users</h1>
      {!live && <SampleBanner path={PATH} />}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
        <input className="input !pl-9" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {rows.length === 0 ? (
        <Empty icon={Users} title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-asphalt text-mist"><tr>{["Name", "Email", "Phone", "Role", "Joined"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="tnum px-4 py-3">{u.phone}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="tnum px-4 py-3">{u.joined || (u.createdAt || "").slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
