#!/usr/bin/env bash
# ==============================================================================
# KostKu Multi-Device Online Launcher
# Script ini menjalankan Backend KostKu dan membuka akses HTTPS online
# sehingga database bisa diakses dari banyak HP, Tablet, dan Laptop secara bersamaan.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=========================================================="
echo "   🚀 KOSTKU - MULTI-DEVICE ONLINE CLOUD LAUNCHER"
echo "=========================================================="
echo ""
echo "[1/3] Menjalankan KostKu Backend (Port 3001)..."
node backend/server.js &
BACKEND_PID=$!

echo "[2/3] Menjalankan Frontend KostKu Vite (Port 5173)..."
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

sleep 2

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "=========================================================="
echo " ✅ APLIKASI AKTIF DI JARINGAN LOKAL / WIFI:"
echo "    💻 Di Laptop:    http://localhost:5173"
echo "    📱 Di HP (WiFi):  http://$LOCAL_IP:5173"
echo "=========================================================="
echo ""
echo "[3/3] Menyiapkan Akses Cloud Online Publik (Pinggy / SSH Tunnel)..."
echo "URL Online akan dibuat agar bisa dibuka dari luar rumah / jaringan seluler:"
echo ""

cleanup() {
  echo "Menghentikan semua proses KostKu..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# Run SSH Tunnel via Pinggy for public access
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:5173 a.pinggy.io || true

wait
