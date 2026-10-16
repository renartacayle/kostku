# Gates: Integrasi Blueprint & Hyperlocal UMKM Specification ke Website KostKu

OWNS: src/pages/BlueprintHub.jsx, src/App.jsx, src/pages/Penghuni.jsx, src/pages/Keuangan.jsx, src/components/Navbar.jsx, src/components/Sidebar.jsx, public/downloads/*, scripts/verify-website-*.mjs, GATES.md

Scope: Integrasi langsung spesifikasi arsitektur BLUEPRINT_SISTEM_KOST.md ke platform website KostKu, mencakup perancangan halaman pusat Blueprint Hub (/blueprint), simulator finansial interaktif Unified Wallet & Overdraft Limit (-15000), ekspor data wajib lapor RT/RW dengan NIK 16 digit pada halaman Penghuni, widget Unified Wallet pada halaman Keuangan, tautan navigasi global, serta ketersediaan direct download PDF, PPTX, dan Markdown blueprint.

- [x] G1: Dedicated interactive Blueprint Hub page implemented with full architectural specs and registered at /blueprint route
  CHECK: node scripts/verify-website-blueprint-page.mjs
  EXPECT: website blueprint page verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=94cc0623149a4cb46a238292b80e3af48dc6f3d67c9db3e4b8aeb1127e00b808; exit=0; EXPECT=matched; output-sha256=815b469b889385f20c6d8e279d589206e7875d87efd44ef2b7ad4d8e6cbf978c; output-bytes=43; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Interactive Unified Wallet and financial mutation simulator implemented with live QRIS vs COD calculation and overdraft limit alert
  CHECK: node scripts/verify-website-wallet-simulator.mjs
  EXPECT: website wallet simulator verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=3dd2146cf70681c2b5124bcf0fa9faf8e78ba2c22001fe544e53dd7018669607; exit=0; EXPECT=matched; output-sha256=26124cbb8d140db736329f2587afbf7905dc796b165091752270932eb2ff33d5; output-bytes=45; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G3: Feature integration in KostKu app pages verified (RT/RW NIK export on Penghuni page and Unified Wallet single-node breakdown on Keuangan page)
  CHECK: node scripts/verify-website-feature-integration.mjs
  EXPECT: website feature integration verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=f8d4cce4ed4ace0e2af3ce6871c472fdbf822586575b313a9cc54ad5f3784b10; exit=0; EXPECT=matched; output-sha256=fce50916e467618a71c169129c2bc46835492aba07c62779f39c1ff4b79fb228; output-bytes=48; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: Global website navigation links to Blueprint Hub and verified direct download links for PDF, PPTX, and Markdown
  CHECK: node scripts/verify-website-navigation-downloads.mjs
  EXPECT: website navigation and downloads verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c1f3f0b1a81928741798c57925ea6fb3601ae5bd834b02921bcd453211984790; exit=0; EXPECT=matched; output-sha256=8397168263a373779ce76ed373a0bfabd15f5ef1c4f7fa45aa04728294a37139; output-bytes=53; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: Production Vite build succeeds with zero errors and clean output artifacts
  CHECK: node scripts/verify-website-production-build.mjs
  EXPECT: website production build verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=2e9fd176a2edd8b3411145597601ffd11718227e87bd655853bddb15953d3ecf; exit=0; EXPECT=matched; output-sha256=3ecab5b02f66d50410d70621283780bf70ff2d9175be73057d8953ba92c95899; output-bytes=45; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries
