#!/bin/bash

# Script ini akan membantu Anda mengupload kode ke GitHub dengan satu kali klik (atau enter)

echo "🚀 Menyiapkan koneksi ke GitHub..."

# Konfigurasi remote (sudah diset di environment ini, tapi disiapkan lagi untuk memastikan)
git remote remove origin 2>/dev/null
git remote add origin https://github.com/ArifiaMulia/RevOps.git

# Pastikan kita di branch 'master' atau 'main'
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo "📂 Branch saat ini: $CURRENT_BRANCH"

echo "📤 Mengupload kode ke GitHub..."
echo "⚠️  PENTING: Anda akan diminta memasukkan Username GitHub dan Password (atau Personal Access Token)."
echo "   Jika Anda menggunakan 2FA, password HARUS berupa Personal Access Token (PAT)."

git push -u origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
  echo "✅ Sukses! Kode berhasil diupload."
  echo "   Lihat di: https://github.com/ArifiaMulia/RevOps"
else
  echo "❌ Gagal mengupload. Pastikan repository 'RevOps' sudah dibuat di GitHub dan Anda punya akses."
fi
