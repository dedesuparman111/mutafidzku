# Deploy Mutafidz PRO — GitHub → Vercel + Supabase.com

## 1. Setup Supabase
1. Buat project baru di https://supabase.com
2. Buka **SQL Editor** → paste isi `supabase_schema.sql` → **Run**.
3. Di **Authentication → Providers → Email**: pastikan **Enable Email provider** aktif.
   - Untuk memudahkan testing, matikan **Confirm email** (opsional).
4. Copy dari **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon public` key → `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia, jangan diekspos)
   - Project ref (bagian URL) → `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID`
5. Sign up admin pertama dengan email `dedesuparman333@gmail.com` (atau ubah email di
   fungsi `handle_new_user` sebelum menjalankan schema). Trigger akan otomatis assign
   role `admin`.

## 2. Push ke GitHub
```bash
git init
git remote add origin https://github.com/<user>/<repo>.git
git add . && git commit -m "init"
git push -u origin main
```

## 3. Import ke Vercel
1. https://vercel.com/new → import repo GitHub.
2. Framework Preset: **Other** (dibiarkan otomatis — `vercel.json` sudah men-set
   `NITRO_PRESET=vercel` sehingga TanStack Start build ke output Vercel).
3. **Environment Variables** — tambahkan semua variabel dari `.env.example`
   (Production + Preview + Development).
4. Deploy.

## 4. Set Auth Redirect URLs (Supabase)
Setelah dapat domain Vercel, di **Supabase → Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: tambahkan `https://your-app.vercel.app/**`

## 5. Login
Buka `https://your-app.vercel.app/auth` → login dengan email admin di atas.
