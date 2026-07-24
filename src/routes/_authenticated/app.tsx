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
  const [showChangePw, setShowChangePw] = useState(false);

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
    window.location.href = "/";
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
              onClick={() => {
                setMenuOpen(false);
                setShowChangePw(true);
              }}
              style={{
                background: "#0d6efd",
                color: "white",
                border: 0,
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Ganti Password
            </button>
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
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 6) { setErr("Password minimal 6 karakter"); return; }
    if (pw !== pw2) { setErr("Konfirmasi password tidak cocok"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
    setPw(""); setPw2("");
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 12 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 12, padding: 16, width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Ganti Password</h3>
          <button onClick={onClose} style={{ border: 0, background: "#eee", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Tutup</button>
        </div>
        {ok ? (
          <div style={{ background: "#d1e7dd", color: "#0f5132", padding: 10, borderRadius: 8, fontSize: 13 }}>
            Password berhasil diperbarui.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {err && <div style={{ background: "#fee", color: "#900", padding: 8, borderRadius: 8, fontSize: 13 }}>{err}</div>}
            <input type="password" placeholder="Password baru" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
            <input type="password" placeholder="Konfirmasi password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14 }} />
            <button type="submit" disabled={busy} style={{ padding: "10px 16px", background: "#0d6efd", color: "white", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
              {busy ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        )}
      </div>
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
        alignItems: "flex-start",
        justifyContent: "center",
        fontFamily: "system-ui",
        padding: 8,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 12,
          padding: 14,
          maxWidth: 780,
          width: "100%",
          maxHeight: "calc(100vh - 16px)",
          overflow: "auto",
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.2 }}>Pengaturan Admin</h2>
          <button onClick={onClose} style={{ border: 0, background: "#eee", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>
            Tutup
          </button>
        </div>

        {err && <div style={{ background: "#fee", color: "#900", padding: 8, borderRadius: 8, marginBottom: 12, fontSize: 13, wordBreak: "break-word" }}>{err}</div>}

        <form
          onSubmit={createUser}
          style={{
            display: "flex",
            flexDirection: "column",
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
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14, width: "100%", boxSizing: "border-box" }}
          />
          <input
            type="text"
            placeholder="Password (min 6)"
            required
            minLength={6}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14, width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6, fontSize: 14, flex: 1 }}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              style={{ padding: "10px 16px", background: "#198754", color: "white", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 14, flex: 1 }}
            >
              {busy ? "..." : "Tambah"}
            </button>
          </div>
        </form>

        {loading ? (
          <div>Memuat daftar user...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, wordBreak: "break-all", minWidth: 0, flex: 1 }}>{u.email}</div>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: u.role === "admin" ? "#0d6efd" : "#6c757d",
                      color: "white",
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {u.role}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => toggleRole(u)} style={btnSm("#0d6efd")}>
                    {u.role === "admin" ? "Jadikan user" : "Jadikan admin"}
                  </button>
                  <button onClick={() => resetPass(u)} style={btnSm("#ffc107")}>Reset PW</button>
                  <button onClick={() => removeUser(u.id)} style={btnSm("#dc3545")}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function btnSm(bg: string): React.CSSProperties {
  return { background: bg, color: "white", border: 0, padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, flex: "1 1 auto", minWidth: 90 };
}
