# Aplikasi Upload Tugas Spreadsheet ke GitHub

Aplikasi ini memungkinkan siswa upload file tugas `.xls` atau `.xlsx` tanpa login. File akan disimpan ke repository GitHub melalui serverless function Vercel.

## Struktur

- `public/index.html` — halaman upload dengan pilihan kelas, nama lengkap, dan NISN
- `public/style.css` — tampilan
- `public/script.js` — validasi dan pengiriman form
- `api/upload.js` — backend upload ke GitHub
- `vercel.json` — konfigurasi Vercel

## Cara pakai

1. Buat repository baru di GitHub.
2. Upload semua file project ini ke repository tersebut.
3. Deploy repository ke Vercel.
4. Tambahkan Environment Variables di Vercel:

```env
GITHUB_TOKEN=isi_dengan_token_github
GITHUB_OWNER=username_atau_organisasi_github
GITHUB_REPO=nama_repository
GITHUB_BRANCH=main
UPLOAD_CODE=kode_rahasia_opsional
```

Jika tidak ingin memakai kode upload, kosongkan `UPLOAD_CODE`.

## Token GitHub

Buat Fine-grained Personal Access Token dengan akses:
- Repository yang dipakai
- Contents: Read and write

Jangan pernah menaruh token di file frontend seperti HTML atau JavaScript.

## Lokasi file upload

File akan masuk ke:

```text
uploads/NAMA_KELAS/nisn_nama_mapel_tanggal.xlsx
```

Contoh:

```text
uploads/X_KULINER_1/0081234567_Ahmad_Fajar_Matematika_2026-05-07T10-15-20-000Z.xlsx
```

## Batasan

- File diterima: `.xls`, `.xlsx`
- Maksimal ukuran file: 10 MB
- Siswa tidak perlu login
- Backend tetap wajib ada agar token GitHub aman


## Pilihan kelas

Pilihan kelas sudah ditetapkan di form:

- X KULINER 1
- X KULINER 2
- X KULINER 3
- X DPB 1
- X DPB 2
- X DPB 3

Siswa wajib mengisi:
- Nama lengkap
- NISN
- Kelas
- Mata pelajaran
- File spreadsheet
