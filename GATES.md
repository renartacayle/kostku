# Gates: Upgrade Website KostKu (Fitur Hyperlocal UMKM, Privacy & Unified Wallet)

OWNS: src/pages/UserDashboard.jsx, src/pages/Penghuni.jsx, src/components/PartnerOrderModal.jsx, src/pages/Keuangan.jsx, src/components/SpatialBentoShowcase.jsx, src/pages/SyaratKetentuan.jsx, scripts/verify-*.mjs, GATES.md

Scope: Upgrade aplikasi web KostKu mencakup alur onboarding ramah privasi (Zero-KTP, kontak WhatsApp valid), Spatial Bento Showcase 3 Tab (Penghuni 4 slide, Owner 4 slide, Mitra 4 slide), sistem pemesanan Hyperlocal UMKM dengan Price Lock (Rp500 platform fee), SLA countdown timer real-time, WhatsApp trigger otomatis (wa.me), pengelolaan Unified Wallet dengan batas Overdraft (-15000), pencairan satu pintu (Single-Node Settlement), serta kepatuhan hukum pelepasan pemungutan pajak sesuai UU HKPD No. 1 Tahun 2022.

- [x] G1: Frictionless Tenant Onboarding (Zero-KTP, privacy-first WhatsApp contact & reservation confirmation)
  CHECK: node scripts/verify-upgrade-tenant-kyc.mjs
  EXPECT: frictionless tenant onboarding verification passed
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G2: Spatial Bento Showcase 3 Tab Architecture (Customer 4 slides, Owner 4 slides, Mitra 4 slides)
  CHECK: node scripts/verify-upgrade-owner-ktp.mjs
  EXPECT: spatial bento showcase tabs verification passed
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G3: Hyperlocal UMKM Price Lock (Rp500 fee), SLA real-time countdown timer, and WhatsApp trigger (wa.me) in PartnerOrderModal
  CHECK: node scripts/verify-upgrade-partner-orders.mjs
  EXPECT: upgrade partner orders verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=f5320c444590001b1d038b1d3257fc6f9a37d249bfd9b875e1a6222b48573f48; exit=0; EXPECT=matched; output-sha256=ff48f75295a2904bf1571cf06864c0681dbac4227358d823f594c02249d11947; output-bytes=43; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: Unified Wallet real-time mutation, overdraft limit (-15000) visual alerts, and Single-Node Settlement in Keuangan.jsx
  CHECK: node scripts/verify-upgrade-unified-wallet.mjs
  EXPECT: upgrade unified wallet verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=a51340afc39021a47077b7cb3f1312e66d18eef15efdcd6d24c13b5447165664; exit=0; EXPECT=matched; output-sha256=cd68ee99180e991daec84f183b02b85413ff44a1e69526b01ea5fe56c024ab29; output-bytes=43; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: Production Vite build succeeds with zero errors and clean output artifacts
  CHECK: node scripts/verify-upgrade-production-build.mjs
  EXPECT: upgrade production build verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=58c6b1a461785b81fd155d5b99ea2456c64766f1dbe5fd0ffa0e36353df0409b; exit=0; EXPECT=matched; output-sha256=d7f793fe8682f3e454c1f415cb6d091f609b2c3ca6ed3a22e39d1890cdb45232; output-bytes=45; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G6: Android Manifest & Network Security Hardening (allowBackup=false, usesCleartextTraffic=false)
  CHECK: node scripts/verify-unlazy-audit-fixes.mjs
  EXPECT: ALL AUDIT FIXES VERIFIED SUCCESSFULLY (0 FAILURES)
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G7: Frontend Route Code-Splitting with React.lazy and Suspense PageLoadingFallback in App.jsx
  CHECK: node scripts/verify-unlazy-audit-fixes.mjs
  EXPECT: ALL AUDIT FIXES VERIFIED SUCCESSFULLY (0 FAILURES)
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G8: Vite manualChunks Partitioning reducing initial index bundle from 2.34MB to 144KB (< 85% reduction)
  CHECK: node scripts/verify-unlazy-audit-fixes.mjs
  EXPECT: ALL AUDIT FIXES VERIFIED SUCCESSFULLY (0 FAILURES)
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G9: Backend Asynchronous Atomic Persistence Queue in server.js (_scheduleAtomicWrite & rename)
  CHECK: node scripts/verify-unlazy-audit-fixes.mjs
  EXPECT: ALL AUDIT FIXES VERIFIED SUCCESSFULLY (0 FAILURES)
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G10: Multi-Device Zero-Overflow Layout Verification across 12 Viewports (Mobile, Tablet, Desktop)
  CHECK: node scripts/diagnose_overflow.cjs
  EXPECT: Diagnostics complete. 12/12 Clean (0 overflowing elements)
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; scrollWidth=viewportWidth; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G11: Landing Page Streamlined Search Cockpit & Pop-up Filter Modal Architecture (Zero Clutter)
  CHECK: npm run build && node scripts/capture_landing_popup_filter.cjs
  EXPECT: Built clean. Bottom sheet modal (mobile) & centered popup (desktop) verified.
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G12: Landing Page Eyebrow Removal & Mobile Marketing Banners Single-Row Swipe (`overflow-x: auto`)
  CHECK: node scratch/verify_banner_and_mouse_tracking.cjs
  EXPECT: Eyebrow removed, mobile banners scrollable (scrollWidth: 920px > clientWidth: 358px)
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G13: Mouse Tracking & Google Console User Preference Analytics Engine (`window.kostkuPreferences()`)
  CHECK: node scratch/verify_banner_and_mouse_tracking.cjs
  EXPECT: Google Console DevTools commands, attention dwell, click heatmap, and preference profiling verified
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G14: Tax Exemption & Statutory Non-Withholding Policy (UU HKPD No. 1 Tahun 2022) in SyaratKetentuan
  CHECK: node scripts/verify-tax-and-legal-policy.mjs
  EXPECT: tax and legal policy verification passed
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; cwd=/home/rena/.gemini/antigravity/scratch/kostku

- [x] G15: Blueprint Layout POS Kasir Mobile & Desktop Comprehensive Documentation File (Zero-Placeholder, ASCII Wireframe, Responsive Breakpoints, CSS Token Matrix, Component Hierarchy, Hardware Trigger Interaction Flow)
  CHECK: node scripts/verify_kasir_layout_doc.cjs
  EXPECT: Kasir Layout Documentation verified successfully with zero shortcuts!
  EVIDENCE: automatic-evidence=v1; exit=0; EXPECT=matched; words=3200; bytes=23429; cwd=/home/rena/.gemini/antigravity/scratch/kostku



