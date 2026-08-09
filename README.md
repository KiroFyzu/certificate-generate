# Sertif Generate

Aplikasi web multi-event untuk menerbitkan dan memverifikasi sertifikat digital. Admin membuat **Event** (seminar/pelatihan/dsb), lalu sertifikatnya bisa didapat peserta lewat tiga jalur: generate sendiri (event mode "Terbuka"), diimport massal dari CSV oleh admin, atau diklaim pakai kode (event mode "Klaim"). Setiap sertifikat berupa PDF + QR code yang bisa diverifikasi publik.

Dibangun dengan [Next.js](https://nextjs.org) (App Router), [Prisma](https://www.prisma.io) + PostgreSQL ([Supabase](https://supabase.com)), [Tailwind CSS](https://tailwindcss.com), [pdf-lib](https://pdf-lib.js.org), dan sesi login berbasis JWT ([jose](https://github.com/panva/jose)).

## Fitur

- Registrasi & login pengguna (password di-hash dengan `bcryptjs`, sesi disimpan sebagai JWT di cookie)
- **Event** — admin bisa buat banyak event, tiap event punya teks sertifikat sendiri (judul, nama event, tanggal, penandatangan), boleh upload background sendiri (PDF/PNG/JPG) dan logo (PNG/JPG, posisi kiri/tengah/kanan atas) atau pakai desain bawaan, plus **preview PDF** langsung di form sebelum disimpan
- Tiap event punya mode **Terbuka** (user login bisa generate sendiri) atau **Klaim** (hanya lewat kode/import admin) — satu user bisa punya banyak sertifikat, satu per event
- **Klaim sertifikat pakai kode** — admin bisa membuat slot sertifikat + kode unik, peserta login lalu masukkan kodenya di dashboard untuk mengambil sertifikatnya
- **Bulk import CSV** — admin upload daftar peserta (nama, email) per event, sistem otomatis buat akun (kalau belum ada) & terbitkan sertifikatnya sekaligus
- **Revoke / aktifkan lagi / hapus permanen sertifikat** dari panel admin — Revoke sifatnya sementara (bisa diaktifkan lagi, riwayatnya tetap tersimpan), Hapus sifatnya permanen (slot/kode klaimnya hilang total, cocok buat bersihkan data salah/duplikat)
- Sertifikat PDF beserta QR code verifikasi, bisa diunduh dari dashboard
- Halaman publik `/verify/[certificateId]` untuk mengecek keabsahan sertifikat
- Panel admin (`/admin`) — tab Overview (statistik), Users, Events, dan Sertifikat
- Rate limiting & pencatatan security event dasar (tabel `RateLimit`, `SecurityEvent`)
- Proteksi rute lewat middleware (`src/proxy.ts`) — rute `/dashboard` dan `/admin` butuh login, `/admin` khusus role `ADMIN`

## Prasyarat

- Node.js 20 atau lebih baru
- npm (atau package manager lain — sesuaikan perintah di bawah)

## Instalasi

1. Clone repo lalu install dependency:

   ```bash
   npm install
   ```

2. Buat project [Supabase](https://supabase.com) (gratis) kalau belum ada, lalu ambil connection string-nya: **Project Settings → Database → Connection string**. Untuk aplikasi server yang jalan terus-menerus (bukan serverless/edge) seperti ini, pakai mode **Session pooler** (port `5432` lewat `pooler.supabase.com`) — lebih kompatibel dengan jaringan IPv4 dibanding direct connection.

3. Buat file `.env` di root project:

   ```bash
   DATABASE_URL="postgresql://postgres.xxxxxxxxxxxx:PASSWORD@aws-0-xxxx.pooler.supabase.com:5432/postgres"
   JWT_SECRET="ganti-dengan-string-acak-yang-panjang"
   ```

   - `DATABASE_URL` — connection string Supabase dari langkah sebelumnya. Ganti `PASSWORD` dengan password database kamu (URL-encode kalau ada karakter spesial).
   - `JWT_SECRET` — kunci untuk menandatangani sesi login. **Wajib diisi**, aplikasi akan gagal start kalau kosong. Jangan pakai nilai default saat deploy ke production.

4. Jalankan migrasi Prisma ke database Supabase itu:

   ```bash
   npx prisma migrate dev
   ```

   Ini akan membuat seluruh tabel (`User`, `Event`, `Certificate`, `SecurityEvent`, `RateLimit`) di database Supabase kamu sesuai `prisma/schema.prisma`.

## Menjalankan mode development

```bash
npm run dev
```

Aplikasi berjalan di [http://localhost:30006](http://localhost:30006) (port sudah di-set lewat script `dev` di `package.json`, bukan default 3000).

## Build & jalankan mode production

```bash
npm run build
npm run start
```

`start` juga berjalan di port `30006`.

## Menjalankan lewat Docker Compose (VPS / mesin sendiri)

Kalau kamu deploy ke Docker "polos" (VPS, `docker compose`, bukan lewat panel seperti Pterodactyl), repo ini menyediakan `Dockerfile` (multi-stage: build lalu jalankan `next start`) dan `docker-compose.yml`.

1. Pastikan `.env` di root project sudah ada berisi `DATABASE_URL` (connection string Supabase) dan `JWT_SECRET` — `docker-compose.yml` membaca keduanya dari file itu lewat `${DATABASE_URL}` / `${JWT_SECRET}`.
2. Build & jalankan:

   ```bash
   docker compose up --build
   ```

   Saat container start, `prisma migrate deploy` otomatis dijalankan dulu (menerapkan migrasi ke database Supabase kamu) sebelum server production (`next start`, port `30006`) menyala. Buka [http://localhost:30006](http://localhost:30006).

3. Database-nya ada di Supabase (cloud), jadi tidak perlu volume untuk data DB. Volume `sertif-uploads` di compose cuma untuk menyimpan background sertifikat yang diupload admin (`public/uploads`), supaya tidak hilang saat container di-rebuild.

> Catatan: setup ini **tidak dipakai** kalau kamu deploy lewat Pterodactyl — lihat section di bawah untuk itu, image Docker-nya sudah disediakan egg-nya sendiri.

## Deploy ke Pterodactyl (egg Node.js generic)

Di Pterodactyl kamu tidak build `Dockerfile` di atas — image Docker sudah ditentukan egg-nya, kamu tinggal atur **Startup Command** di panel dan upload file project via SFTP.

### 1. Docker Image

Di tab **Startup** server, pilih image Node.js yang tersedia di egg (idealnya **Node 20**, sesuai dependency project ini — mis. `ghcr.io/pterodactyl/yolks:nodejs_20`).

### 2. Upload file project

Upload lewat SFTP ke folder server (`/home/container`), tapi **jangan** upload item berikut — biarkan dibuat ulang langsung di server:

- `node_modules/` — ada binding native (`pg`) yang harus di-build ulang sesuai OS container, hasil `npm install` di Windows tidak akan jalan di Linux.
- `.next/`, `.next.zip`, `sertif-generate.zip`
- `.git/`

Upload juga file **`.env`** kamu (`DATABASE_URL="<connection string Supabase>"` dan `JWT_SECRET=...`) langsung ke folder server — egg generic biasanya tidak otomatis inject env custom, jadi cara termudah ya lewat file `.env` ini (otomatis dibaca `prisma.config.ts` dan Next.js). Kalau Supabase project-mu membatasi akses lewat IP allowlist, pastikan itu di-nonaktifkan atau IP server Pterodactyl-mu diizinkan.

### 3. Startup Command

Ganti **Startup Command** di tab Startup jadi:

```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build && npx next start -p {{SERVER_PORT}}
```

**Penting:** jangan pakai `npm run start` biasa — script itu hardcode ke port `30006` (lihat `package.json`), padahal Pterodactyl kasih port dinamis lewat variabel `{{SERVER_PORT}}`. Panggil `next start -p {{SERVER_PORT}}` langsung supaya port-nya ikut alokasi yang di-assign panel.

Command di atas melakukan install + build + start setiap kali server **restart**, jadi startup-nya agak lama (build Next.js makan waktu). Kalau kamu punya akses ke bagian **Install Script** egg-nya (di Admin → Eggs, bukan per-server), pindahkan install & build ke sana supaya cuma jalan sekali saat install/reinstall:

Install Script (di Egg config):

```bash
npm install
npx prisma generate
npm run build
```

Startup Command jadi lebih ringan tiap restart:

```
npx prisma migrate deploy && npx next start -p {{SERVER_PORT}}
```

### 4. Database

Data disimpan di Supabase (cloud), bukan di server Pterodactyl, jadi aman meski server di-restart, container-nya diganti, atau di-reinstall — asal `DATABASE_URL` di `.env` tetap sama. File background sertifikat hasil upload admin (`public/uploads`) tetap ikut folder `/home/container` yang persistent secara default.

### Kalau sebelumnya kena error "Could not find a production build"

Error `Could not find a production build in the '.next' directory` artinya `next start` sempat dijalankan sebelum `next build` selesai (atau `.next` ter-hapus/tidak ikut ke server). Startup Command di atas selalu menjalankan `npm run build` (atau Install Script menjalankannya sekali) sebelum `next start`, jadi pastikan build-nya benar-benar selesai tanpa error di log konsol server sebelum command `next start` dieksekusi.

## Membuat akun admin

Belum ada UI untuk promote user jadi admin, jadi pakai salah satu cara berikut setelah database ter-migrasi:

- **Script cepat** — jalankan:

  ```bash
  node make-admin.js
  ```

  Secara default script ini membuat/mem-upgrade akun `admin@example.com` / `password123` menjadi role `ADMIN`. Edit `email`/`password` di dalam file sebelum menjalankan kalau mau kredensial lain.

- **Lewat Prisma Studio** — buka `npx prisma studio`, cari user yang sudah register, lalu ubah kolom `role` jadi `ADMIN`.

Login admin ada di halaman terpisah: `/admin-login`.

## Alur singkat penggunaan

**Sebagai peserta:**

1. Buka `/register` untuk membuat akun, lalu login di `/login` dan masuk ke `/dashboard`.
2. Kalau ada event bermode "Terbuka", tinggal klik **Generate Sertifikat** di dashboard.
3. Kalau punya kode klaim dari panitia (event bermode "Klaim", atau kode satuan dari admin), masukkan di kotak **Klaim Sertifikat**.
4. File PDF (dengan QR code) bisa diunduh dari dashboard. Scan QR code atau buka `/verify/[certificateId]` untuk memverifikasi keasliannya secara publik.

**Sebagai admin** (login di `/admin-login`):

1. Tab **Events** → **Buat Event**, isi teks sertifikat (judul, tanggal, penandatangan), opsional upload background dan/atau logo sendiri, lalu klik **Lihat Preview** untuk cek tampilan PDF-nya (pakai nama contoh) sebelum **Simpan**. Pilih mode Terbuka atau Klaim.
2. **Import CSV** di event tersebut untuk menerbitkan sertifikat massal dari daftar nama+email — hasilnya termasuk password sementara untuk akun yang baru dibuat, sebarkan manual ke pesertanya.
3. Atau **Kode Klaim** untuk membuat sejumlah kode yang bisa dibagikan ke peserta agar mereka klaim sendiri di dashboard.
4. Tab **Sertifikat** untuk melihat semua sertifikat lintas event, filter berdasarkan event/status, serta **Revoke**/**Aktifkan Lagi** (nonaktifkan sementara, bisa dibalikin) atau **Hapus** (permanen, tidak bisa dibatalkan).

## Format CSV bulk import

Kolom yang dibaca (nama header tidak case-sensitive): `full_name` (atau `nama`) dan `email`. Contoh:

```csv
full_name,email
Budi Santoso,budi@example.com
Siti Aminah,siti@example.com
```

Maksimal 500 baris per import. Baris dengan user yang sudah punya sertifikat di event yang sama akan dilewati (skipped), bukan menggagalkan seluruh import.

## Struktur project (ringkas)

```
src/
  app/
    (auth)/login, register, admin-login   # halaman auth
    dashboard/                            # dashboard user
    admin/                                # panel admin
    verify/[certificateId]/               # halaman verifikasi publik
    api/
      auth/            # register, login, logout, me
      certificate/     # generate & download sertifikat
      claim/           # klaim sertifikat pakai kode
      events/          # daftar event terbuka (publik)
      verify/          # endpoint verifikasi
      admin/           # events, certificates (revoke/reinstate), bulk-import, claims, stats, users
  components/           # komponen UI bersama (mis. Header)
  lib/
    auth.ts               # sign/verify session JWT, requireAdmin guard
    prisma.ts             # Prisma client
    rate-limit.ts         # helper rate limiting
    certificate-id.ts     # generator ID sertifikat & kode klaim
    certificate-pdf.ts    # rendering PDF sertifikat (pakai teks/template per Event)
  proxy.ts               # middleware proteksi rute
prisma/
  schema.prisma          # model database (User, Event, Certificate, SecurityEvent, RateLimit)
  migrations/             # riwayat migrasi
public/
  template.pdf            # template PDF sertifikat default
  uploads/events/          # background sertifikat hasil upload admin (runtime, di-gitignore)
```

## Catatan lain

- Database pakai PostgreSQL di [Supabase](https://supabase.com) — `DATABASE_URL` di `.env` **wajib diisi** connection string Supabase kamu sendiri, jangan pernah commit `.env` ke git (sudah di-`.gitignore`).
- File `AGENTS.md` / `CLAUDE.md` berisi instruksi khusus untuk AI coding assistant, bukan bagian dari dokumentasi penggunaan aplikasi.
