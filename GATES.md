# Gates: Technical Blueprint & System Specification (Sistem Manajemen Kost & Hyperlocal UMKM)

OWNS: BLUEPRINT_SISTEM_KOST.md, scripts/verify-blueprint-sistem-kost-*.mjs, GATES.md

Scope: Implementasi menyeluruh dokumen arsitektur dan spesifikasi teknis BLUEPRINT_SISTEM_KOST.md mencakup model bisnis B2B2C Freemium, 4 User Roles, 5 Koleksi Cloud Firestore terstruktur, logika mutasi Unified Wallet & Overdraft Limit (-15000), Firebase Storage Security Rules KTP, SLA Engine, dan checklist UI lengkap.

- [x] G1: Master blueprint document BLUEPRINT_SISTEM_KOST.md authored with complete depth covering business model, roles, database schema, implementation stages, and UI checklist
  CHECK: node scripts/verify-blueprint-sistem-kost-doc.mjs
  EXPECT: blueprint sistem kost doc verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=14b6eb8edce402edb57f5a0f4de6d67ff1e623aaaa040b47175d1de9025194cf; exit=0; EXPECT=matched; output-sha256=89fdb6aa75e66cc345a8d6809ecfbb184283a4b64e83140b71a90ad276a28779; output-bytes=46; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Cloud Firestore schema definitions verified across all 5 collections (users, properties, mitra_umkm, products, orders) with exact fields and nested KYC/wallet objects
  CHECK: node scripts/verify-blueprint-sistem-kost-schema.mjs
  EXPECT: blueprint sistem kost schema verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9dd664ce83410d332214dc7651e56a8fc6d176b5013a3a6d98a6a9de12275f19; exit=0; EXPECT=matched; output-sha256=fadc2b10399148995c391e64c8869479f8db51182fef81bd736e91b3475fb7f7; output-bytes=49; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G3: Unified Wallet mathematical mutation logic verified for QRIS settlement, COD fee debit, overdraft limit (-15000), and single-node owner payout
  CHECK: node scripts/verify-blueprint-sistem-kost-wallet.mjs
  EXPECT: blueprint sistem kost wallet verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c021694f89d65277233ed2f46e19324be05d14e5b124db594f32eaef097182f0; exit=0; EXPECT=matched; output-sha256=c25b5b303d1cb8f2f06e8083a8ae34e1ab5dbcb591e9b86050c0a49ba1988bb5; output-bytes=49; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: Firebase Security Rules and KTP data privacy specifications verified for Cloud Storage and Firestore queries
  CHECK: node scripts/verify-blueprint-sistem-kost-security.mjs
  EXPECT: blueprint sistem kost security verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=7f81834ea86228efe02ed723f1a1254f650cdc21c603ac625ad11a07937f8a33; exit=0; EXPECT=matched; output-sha256=45d2f832d054d4b4f26d4fbaa33f586d315d6f79f98efce12f20a4a7da256437; output-bytes=51; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: Master blueprint file verified on Desktop at /home/rena/Desktop/BLUEPRINT_SISTEM_KOST.md with complete content and zero placeholders
  CHECK: node scripts/verify-blueprint-sistem-kost-desktop.mjs
  EXPECT: blueprint sistem kost desktop export verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ba2330afb93111855231f9236edd235a4e61e27200cc6e83d932b3282ac05b1; exit=0; EXPECT=matched; output-sha256=6d25f38850119c3783cd8b729028736c5b377d67cb8aac3845e579518a873ebc; output-bytes=57; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries
