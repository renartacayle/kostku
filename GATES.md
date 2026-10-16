# Gates: Upgrade Website KostKu (Fitur Hyperlocal UMKM & Unified Wallet)

OWNS: src/components/TenantKycModal.jsx, src/components/TenantKycDetailModal.jsx, src/pages/UserDashboard.jsx, src/pages/Penghuni.jsx, src/components/PartnerOrderModal.jsx, src/pages/Keuangan.jsx, scripts/verify-upgrade-*.mjs, GATES.md

Scope: Upgrade aplikasi web KostKu mencakup alur onboarding KYC Check-in Tenant dengan validasi 16 digit NIK dan upload foto KTP, verifikasi KTP dan export RT/RW oleh Owner pada halaman Penghuni, sistem pemesanan Hyperlocal UMKM dengan Price Lock (Rp500 platform fee), SLA countdown timer real-time, WhatsApp trigger otomatis (wa.me), serta pengelolaan Unified Wallet dengan batas Overdraft (-15000) dan pencairan satu pintu (Single-Node Settlement).

- [x] G1: Tenant KYC & KTP Check-in onboarding implemented in UserDashboard and TenantKycModal with 16-digit NIK validation
  CHECK: node scripts/verify-upgrade-tenant-kyc.mjs
  EXPECT: upgrade tenant kyc verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=44d6e8c2dcf89f50e146bafe990719ea44705a3ac8936c87a187b6d25c0380e3; exit=0; EXPECT=matched; output-sha256=15580c9cf1fd95c6a370c3acd15752d0b57bfe594f90f45eabf2f16252683216; output-bytes=39; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Owner KTP verification and inspection modal implemented in Penghuni.jsx with TenantKycDetailModal
  CHECK: node scripts/verify-upgrade-owner-ktp.mjs
  EXPECT: upgrade owner ktp verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=ae4f0915ce5b70fa3ddfc0401cfe171d103d27e0bb1b1057a35b593b5874241f; exit=0; EXPECT=matched; output-sha256=574e920c6254b222b0838c9e37f7fd21ff51c7aadcb627ed40d0eb8c98635c16; output-bytes=38; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

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
