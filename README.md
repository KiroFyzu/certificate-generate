# Sertif Generate

Aplikasi web untuk menerbitkan dan memverifikasi sertifikat digital. Setiap pengguna terdaftar bisa men-generate satu sertifikat (PDF, lengkap dengan QR code) yang dapat diverifikasi keasliannya secara publik lewat halaman verifikasi. Ada juga panel admin untuk memantau pengguna dan statistik.

Dibangun dengan [Next.js](https://nextjs.org) (App Router), [Prisma](https://www.prisma.io) + SQLite/libSQL, [Tailwind CSS](https://tailwindcss.com), [pdf-lib](https://pdf-lib.js.org), dan sesi login berbasis JWT ([jose](https://github.com/panva/jose)).

## Fitur

- Registrasi & login pengguna (password di-hash dengan `bcryptjs`, sesi disimpan sebagai JWT di cookie)
- Generate sertifikat PDF (template di `public/template.pdf`) beserta QR code verifikasi
- Halaman publik `/verify/[certificateId]` untuk mengecek keabsahan sertifikat
- Dashboard pengguna untuk melihat/mengunduh sertifikat sendiri
- Panel admin (`/admin`) untuk melihat daftar pengguna dan statistik
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

2. Buat file `.env` di root project (isi contoh berikut boleh diganti):

   ```bash
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="ganti-dengan-string-acak-yang-panjang"
   ```

   - `DATABASE_URL` — lokasi database SQLite lokal (dipakai Prisma via adapter libSQL).
   - `JWT_SECRET` — kunci untuk menandatangani sesi login. **Wajib diisi**, aplikasi akan gagal start kalau kosong. Jangan pakai nilai default saat deploy ke production.

3. Buat database & jalankan migrasi Prisma:

   ```bash
   npx prisma migrate dev
   ```

   Ini akan membuat file `dev.db` beserta seluruh tabel (`User`, `Certificate`, `SecurityEvent`, `RateLimit`) sesuai `prisma/schema.prisma`.

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

1. Buka `/register` untuk membuat akun.
2. Login di `/login`, lalu masuk ke `/dashboard`.
3. Klik generate untuk membuat sertifikat — file PDF (dengan QR code) bisa diunduh dari dashboard.
4. Scan QR code atau buka `/verify/[certificateId]` untuk memverifikasi keaslian sertifikat tersebut secara publik.
5. Login sebagai admin (`/admin-login`) untuk melihat daftar user & statistik di `/admin`.

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
      verify/          # endpoint verifikasi
      admin/           # stats & users (khusus admin)
  components/           # komponen UI bersama (mis. Header)
  lib/
    auth.ts             # sign/verify session JWT
    prisma.ts           # Prisma client
    rate-limit.ts        # helper rate limiting
  proxy.ts               # middleware proteksi rute
prisma/
  schema.prisma          # model database
  migrations/             # riwayat migrasi
public/
  template.pdf            # template PDF sertifikat
```

## Catatan lain

- Database default pakai SQLite lokal (`dev.db`) — file ini di-ignore dari git, jangan di-commit.
- File `AGENTS.md` / `CLAUDE.md` berisi instruksi khusus untuk AI coding assistant, bukan bagian dari dokumentasi penggunaan aplikasi.
