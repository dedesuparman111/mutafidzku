import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapAdminStatus, bootstrapAdminCreate } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Mutafidz PRO" },
      { name: "description", content: "Halaman login Mutafidz PRO." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [mode, setMode] = useState<"login" | "bootstrap">("login");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        navigate({ to: "/" });
        return;
      }
      try {
        const status = await bootstrapAdminStatus();
        if (status.needsBootstrap) setNeedsBootstrap(true);
      } catch {
        // ignore
      }
    })();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "bootstrap") {
        await bootstrapAdminCreate({ data: { email, password } });
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #198754 0%, #0d6efd 100%)",
        padding: 16,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <h1 style={{ margin: 0, textAlign: "center", color: "#198754", fontSize: 24 }}>Mutafidz PRO</h1>
        <p style={{ textAlign: "center", color: "#6c757d", marginTop: 4, marginBottom: 24, fontSize: 14 }}>
          {mode === "bootstrap" ? "Setup Admin Pertama" : "Masuk untuk melanjutkan"}
        </p>

        {err && (
          <div style={{ background: "#fee", color: "#900", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{err}</div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: 12,
              background: "#198754",
              color: "white",
              border: 0,
              borderRadius: 8,
              fontSize: 16,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {busy ? "Memproses..." : mode === "bootstrap" ? "Buat Akun Admin & Masuk" : "Masuk"}
          </button>
        </form>

        {needsBootstrap && (
          <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderRadius: 8, fontSize: 13 }}>
            <strong>Setup awal:</strong> belum ada admin. Klik di bawah untuk membuat akun admin pertama menggunakan email
            yang telah dikonfigurasi.
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setMode(mode === "bootstrap" ? "login" : "bootstrap")}
                style={{ background: "transparent", border: "1px solid #856404", color: "#856404", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
              >
                {mode === "bootstrap" ? "Kembali ke login" : "Buat admin pertama"}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#adb5bd", fontSize: 12, marginTop: 24, marginBottom: 0 }}>
          Pendaftaran mandiri dinonaktifkan. Akun dibuat oleh admin.
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  border: "1px solid #dee2e6",
  borderRadius: 8,
  fontSize: 15,
};
