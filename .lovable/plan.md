## Tujuan
- Hapus total sisa pengaturan Google Apps Script.
- Aplikasi hanya bisa dipakai setelah login (tanpa self-signup).
- Admin pertama ditentukan lewat email yang Anda beri.
- Admin melihat menu **Pengaturan** untuk: CRUD user (buat/hapus/reset password/promote), dan kelola semua data aplikasi (santri, murojaah, hafalan) milik siapapun.
- User biasa: hanya kelola data miliknya sendiri, tanpa akses Pengaturan.

## Arsitektur
- Aktifkan **Lovable Cloud** (Supabase) sebagai backend.
- Buat route TanStack:
  - `/auth` → halaman login (email + password, tanpa tombol daftar).
  - `/` → gate: jika belum login → redirect `/auth`. Jika sudah login → render aplikasi HTML lewat iframe seperti sekarang.
- Kirim session Supabase ke dalam iframe (via `postMessage`) supaya kode di dalam `mutafidz.html` bisa pakai `supabase-js` untuk CRUD dengan RLS.

## Skema database (migration)
- `profiles(id uuid pk → auth.users, email, full_name, created_at)` — auto-insert via trigger `on_auth_user_created`.
- `app_role` enum: `admin`, `user`.
- `user_roles(id, user_id, role, unique(user_id, role))` + `has_role(_user_id, _role)` security-definer.
- Trigger `grant_admin_for_bootstrap_email`: kalau email user baru cocok dengan admin bootstrap email → auto insert role `admin`; selain itu insert role `user`.
- Tabel data lama (`students`, `murojaah`, `memorization`, `user_settings`) tetap. RLS diperbarui:
  - User biasa: hanya lihat/ubah baris dengan `user_id = auth.uid()`.
  - Admin: bisa SELECT/INSERT/UPDATE/DELETE semua baris (via `has_role(auth.uid(),'admin')`).
- GRANT `authenticated` pada semua tabel; tidak ada akses anon.

## Perubahan file
- `supabase_schema.sql` diperbarui (referensi manual; migration asli dijalankan lewat tool).
- `public/mutafidz.html`:
  - Hapus semua UI/JS sisa GAS (`GAS.run`, config spreadsheet, dsb) — sudah sebagian, sisanya dibersihkan.
  - Tambah inisialisasi `supabase-js` (CDN) dengan session yang diterima dari parent via `postMessage`.
  - Ganti semua penulisan/pembacaan `localStorage` untuk `students`/`murojaah`/`memorization`/`user_settings` menjadi query Supabase.
  - Tab **Pengaturan** hanya tampil kalau role = `admin`. Isinya:
    1. **Manajemen User**: list user (dari `profiles` + role), form tambah user (email+password, opsi role), tombol hapus, tombol reset password, tombol promote/demote admin.
    2. **Manajemen Data**: tabel semua santri/murojaah/hafalan lintas user dengan aksi edit/hapus.
    3. Preferensi tampilan (dark mode, qari, dsb) tetap ada tapi dipindah ke section "Preferensi" yang terlihat semua user.
- `src/routes/auth.tsx` — halaman login baru.
- `src/routes/index.tsx` — tambah gate auth sebelum render iframe.
- `src/routes/__root.tsx` — pasang listener `onAuthStateChange` untuk invalidasi router.
- Server function `admin-create-user.functions.ts` (pakai `supabaseAdmin`) — dipanggil dari halaman admin untuk buat user via Auth Admin API, setelah memverifikasi caller adalah admin.

## Yang saya butuhkan dari Anda
- **Email admin pertama** (contoh: `admin@domain.com`) — akan di-hardcode di trigger. User dengan email itu otomatis jadi admin saat pertama signup.
- Setelah plan ini disetujui: Anda buat akun admin lewat halaman `/auth`? Karena Anda memilih **tanpa self-signup**, saya akan buat pengecualian sekali: form signup rahasia di `/auth?bootstrap=1` yang hanya berfungsi untuk email admin bootstrap. Setelah admin pertama ada, jalur itu ditutup dan pembuatan user selanjutnya lewat halaman admin.

## Yang TIDAK termasuk
- Migrasi data localStorage lama (Anda memilih "mulai dari kosong").
- Login dengan Google/Apple.

Balas dengan **email admin bootstrap** untuk saya lanjutkan.