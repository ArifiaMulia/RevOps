# Panduan Koneksi GitHub & Deployment Otomatis

Panduan ini akan membantu Anda menghubungkan proyek lokal ini ke GitHub dan melakukan update di server dengan satu perintah mudah.

## 1. Persiapan di GitHub

1.  Login ke [GitHub](https://github.com).
2.  Buat **Repository Baru** (New Repository).
    *   **Repository name**: `prasetia-revops-hub` (atau nama lain).
    *   **Visibility**: Private (disarankan karena ada kode internal).
    *   **Jangan centang** "Initialize with README", .gitignore, atau License (karena kita sudah punya di lokal).
3.  Klik **Create repository**.
4.  Salin URL repository Anda (contoh: `https://github.com/username/prasetia-revops-hub.git`).

## 2. Menghubungkan Folder Lokal ke GitHub

Di komputer Anda (tempat Anda mendownload file ini), buka Terminal/Command Prompt di dalam folder `prasetia-revops-hub` dan jalankan perintah berikut:

```bash
# 1. Tambahkan alamat GitHub sebagai 'origin'
git remote add origin https://github.com/USERNAME/prasetia-revops-hub.git

# 2. Upload semua kode ke GitHub
git branch -M main
git push -u origin main
```

*(Jika diminta username/password, gunakan GitHub Personal Access Token jika Anda menggunakan HTTPS)*

## 3. Setup di Server (Deployment)

Sekarang kode Anda sudah ada di GitHub. Di server `revops.virtuenet.space` (atau server lain), lakukan ini **sekali saja** untuk pertama kali:

### A. Clone Repository (Pertama Kali)

```bash
# Masuk ke folder tujuan
cd /var/www/ (atau folder pilihan Anda)

# Clone repository
git clone https://github.com/USERNAME/prasetia-revops-hub.git

# Masuk ke folder project
cd prasetia-revops-hub

# Buat file .env (PENTING! File ini tidak di-upload ke GitHub demi keamanan)
nano .env
# (Copy paste isi file .env dari lokal Anda ke sini)
```

### B. Menjalankan Aplikasi

```bash
docker compose up --build -d
```

## 4. Cara Update Aplikasi (Setiap Ada Perubahan)

Setiap kali Anda selesai mengedit kode di komputer lokal:

1.  **Push perubahan ke GitHub**:
    ```bash
    git add .
    git commit -m "Deskripsi perubahan Anda"
    git push origin main
    ```

2.  **Update di Server (Sangat Mudah!)**:
    Login ke server Anda, masuk ke folder project, dan jalankan script otomatis yang sudah kami buatkan:

    ```bash
    # Jalankan script deploy
    ./scripts/deploy.sh
    ```

    *Script ini akan otomatis:*
    *   Mengambil kode terbaru dari GitHub (`git pull`)
    *   Membangun ulang Docker container (`docker compose build`)
    *   Restart aplikasi (`docker compose up`)

---

### Tips Tambahan: GitHub Actions (Opsional)

Jika Anda ingin lebih canggih (CI/CD), Anda bisa menambahkan file `.github/workflows/deploy.yml` nanti untuk membuat server otomatis ter-update setiap kali Anda push, tanpa perlu login ke server sama sekali. Namun, metode `git pull` di atas adalah yang paling stabil dan mudah untuk saat ini.
