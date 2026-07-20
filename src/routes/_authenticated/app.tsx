import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  component: MutafidzApp,
});

type RoleRow = { role: "admin" | "user" };

function MutafidzApp() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setEmail(userData.user.email ?? "");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const admin = (roles as RoleRow[] | null)?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);
      setReady(true);
    })();
  }, []);

  const iframeSrc = useMemo(() => {
    if (!ready) return "";
    // Pass session + admin flag via hash so mutafidz.html can consume them
    return `/index.html#role=${isAdmin ? "admin" : "user"}&email=${encodeURIComponent(email)}`;
  }, [ready, isAdmin, email]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui" }}>
        Memuat...
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 9999, fontFamily: "system-ui" }}>
        <button
          onClick={() => setMenuOpen((o: boolean) => !o)}
          title="Menu pengguna"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: 0,
            background: "rgba(0,0,0,0.55)",
            color: "white",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          ☰
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: 48,
              right: 0,
              width: 220,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, color: "#333", wordBreak: "break-all" }}>
              {email}
              {isAdmin && (
                <span
                  style={{
                    marginLeft: 6,
                    background: "#0d6efd",
                    color: "white",
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 999,
                  }}
                >
                  admin
                </span>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowAdmin(true);
                }}
                style={{
                  background: "#198754",
                  color: "white",
                  border: 0,
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Pengaturan
              </button>
            )}
            <button
              onClick={signOut}
              style={{
                background: "#dc3545",
                color: "white",
                border: 0,
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Keluar
            </button>
          </div>
        )}
      </div>

      <iframe
        src={iframeSrc}
        title="Mutafidz PRO"
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", border: "none" }}
      />

      {showAdmin && isAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

type UserRow = { id: string; email: string; full_name: string | null; role: "admin" | "user" };

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const { adminListUsers } = await import("@/lib/admin.functions");
      const list = await adminListUsers();
      setUsers(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { adminCreateUser } = await import("@/lib/admin.functions");
      await adminCreateUser({ data: { email: newEmail, password: newPass, role: newRole } });
      setNewEmail("");
      setNewPass("");
      setNewRole("user");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat user");
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Hapus user ini beserta semua datanya?")) return;
    try {
      const { adminDeleteUser } = await import("@/lib/admin.functions");
      await adminDeleteUser({ data: { userId: id } });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  const toggleRole = async (u: UserRow) => {
    const next = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Ubah role ${u.email} menjadi ${next}?`)) return;
    try {
      const { adminSetRole } = await import("@/lib/admin.functions");
      await adminSetRole({ data: { userId: u.id, role: next } });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mengubah role");
    }
  };

  const resetPass = async (u: UserRow) => {
    const p = prompt(`Password baru untuk ${u.email}:`);
    if (!p) return;
    try {
      const { adminResetPassword } = await import("@/lib/admin.functions");
      await adminResetPassword({ data: { userId: u.id, password: p } });
      alert("Password diperbarui.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal reset password");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 12,
          padding: 20,
          maxWidth: 780,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Pengaturan Admin — Manajemen User</h2>
          <button onClick={onClose} style={{ border: 0, background: "#eee", padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}>
            Tutup
          </button>
        </div>

        {err && <div style={{ background: "#fee", color: "#900", padding: 8, borderRadius: 8, marginBottom: 12 }}>{err}</div>}

        <form
          onSubmit={createUser}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto auto",
            gap: 8,
            marginBottom: 16,
            padding: 12,
            background: "#f8f9fa",
            borderRadius: 8,
          }}
        >
          <input
            type="email"
            placeholder="Email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <input
            type="text"
            placeholder="Password (min 6)"
            required
            minLength={6}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            style={{ padding: "8px 16px", background: "#198754", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}
          >
            {busy ? "..." : "Tambah"}
          </button>
        </form>

        {loading ? (
          <div>Memuat daftar user...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Email</th>
                <th style={{ textAlign: "left", padding: 8 }}>Role</th>
                <th style={{ textAlign: "right", padding: 8 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: u.role === "admin" ? "#0d6efd" : "#6c757d",
                        color: "white",
                        fontSize: 12,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: 8, textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => toggleRole(u)} style={btnSm("#0d6efd")}>
                      {u.role === "admin" ? "Jadikan user" : "Jadikan admin"}
                    </button>{" "}
                    <button onClick={() => resetPass(u)} style={btnSm("#ffc107")}>Reset PW</button>{" "}
                    <button onClick={() => removeUser(u.id)} style={btnSm("#dc3545")}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function btnSm(bg: string): React.CSSProperties {
  return { background: bg, color: "white", border: 0, padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12 };
}
