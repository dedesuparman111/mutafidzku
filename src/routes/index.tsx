import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mutafidz PRO — Manajemen Hafalan & Murojaah Al-Qur'an" },
      {
        name: "description",
        content:
          "Mutafidz PRO membantu pengajar dan santri mengelola hafalan, murojaah, dan progres tahfidz Al-Qur'an secara terstruktur, modern, dan mudah digunakan.",
      },
      { property: "og:title", content: "Mutafidz PRO — Manajemen Hafalan & Murojaah Al-Qur'an" },
      {
        property: "og:description",
        content:
          "Mutafidz PRO membantu pengajar dan santri mengelola hafalan, murojaah, dan progres tahfidz Al-Qur'an secara terstruktur, modern, dan mudah digunakan.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              M
            </div>
            <span className="text-lg font-bold tracking-tight">Mutafidz PRO</span>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="#fitur"
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Fitur
            </a>
            <a
              href="#tentang"
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Tentang
            </a>
            <Link
              to="/auth"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, hsl(var(--primary) / 0.25), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            📖 Manajemen Tahfidz Digital
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Kelola Hafalan Al-Qur'an
            <br />
            <span className="text-primary">Lebih Mudah &amp; Terarah</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Mutafidz PRO adalah aplikasi manajemen tahfidz untuk pengajar, orang tua, dan santri —
            pantau hafalan baru, murojaah, dan progres harian dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              Masuk ke Aplikasi →
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Lihat Fitur
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Fitur Utama</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Dirancang khusus untuk kebutuhan pengelolaan hafalan Al-Qur'an modern.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon="👥"
            title="Manajemen Santri"
            desc="CRUD data santri dengan ID otomatis format YYMMXXXX. Rapi, terurut, dan mudah dicari."
          />
          <Feature
            icon="📗"
            title="Catatan Hafalan"
            desc="Rekam hafalan baru per surat dan ayat, lengkap dengan tanggal dan catatan pengajar."
          />
          <Feature
            icon="🔁"
            title="Murojaah Harian"
            desc="Pantau rutinitas murojaah setiap santri untuk memastikan hafalan tetap terjaga."
          />
          <Feature
            icon="🎧"
            title="Surat Acak + Audio"
            desc="Dapatkan surat pilihan acak beserta arti dan audio langsung dari API equran.id."
          />
          <Feature
            icon="🔐"
            title="Login Aman"
            desc="Sistem otentikasi dengan role admin & user. Data tiap pengguna dilindungi RLS."
          />
          <Feature
            icon="⚙️"
            title="Panel Admin"
            desc="Admin bisa menambah, mengubah role, reset password, dan menghapus pengguna."
          />
        </div>
      </section>

      {/* About */}
      <section id="tentang" className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Tentang Mutafidz PRO</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Mutafidz PRO lahir dari kebutuhan nyata para pengajar tahfidz untuk memiliki alat
              bantu yang sederhana namun kuat. Alih-alih mencatat di buku atau spreadsheet yang
              tersebar, semua data — santri, hafalan, dan murojaah — tersimpan aman di satu tempat.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Aplikasi ini dibangun dengan teknologi modern, mendukung akses multi-user dengan
              proteksi data per akun, serta dapat diakses dari perangkat apa pun.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <h3 className="text-lg font-semibold">Cocok untuk:</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>✅ Pengajar tahfidz &amp; ustadz/ustadzah</li>
              <li>✅ Rumah Qur'an &amp; pesantren</li>
              <li>✅ Orang tua yang membimbing hafalan anak</li>
              <li>✅ Santri yang ingin memantau progres mandiri</li>
            </ul>
            <Link
              to="/auth"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Mulai Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">Siap memulai?</h2>
        <p className="mt-3 text-muted-foreground">
          Masuk ke aplikasi dan mulai kelola hafalan hari ini.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          Masuk ke Mutafidz PRO
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mutafidz PRO — Manajemen Tahfidz Digital
      </footer>
    </div>
  );
}
