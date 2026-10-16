#!/usr/bin/env bash
# =================================================================
# KOSTKU AUTOMATED PRODUCTION DEPLOYMENT SCRIPT
# Jalankan script ini di server: bash scripts/deploy.sh
# =================================================================

set -e

echo "🚀 [1/5] Memulai deployment KostKu ke Production..."

# 1. Update kode terbaru dari git repository
if [ -d ".git" ]; then
  echo "📦 Menarik update terbaru dari origin main..."
  git pull origin main
fi

# 2. Build Frontend Single Page Application
echo "⚙️ [2/5] Menginstal dependensi dan mem-build asset frontend..."
npm install
npm run build

# 3. Siapkan dependensi backend
echo "🔧 [3/5] Menginstal dependensi backend production..."
cd backend
npm install --omit=dev
cd ..

# 4. Validasi keamanan & stress test
echo "🛡️ [4/5] Menjalankan test suite keamanan dan payment gateway..."
node tests/security_and_qris_stress_test.cjs

# 5. Reload server (Pilih PM2 atau Docker)
echo "🔄 [5/5] Me-restart proses server aplikasi..."
if command -v pm2 &> /dev/null; then
  echo "Menggunakan PM2..."
  pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
  pm2 save
elif command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  echo "Menggunakan Docker Compose..."
  docker compose down
  docker compose up -d --build
else
  echo "💡 PM2/Docker tidak terdeteksi. Menjalankan server via Node langsung..."
  npm start &
fi

echo "=============================================================="
echo "✅ DEPLOYMENT BERHASIL! KostKu sudah live di mode Production."
echo "   Endpoint Health: http://localhost:3001/api/health"
echo "=============================================================="
