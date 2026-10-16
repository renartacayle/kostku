# Gates: Spesifikasi Kebutuhan Perangkat Lunak (SKPL) KostKu

OWNS: docs/SKPL_KostKu.md, scripts/verify-skpl-*.mjs, GATES.md

Scope: Menghasilkan dokumen akademik SKPL KostKu berstandar Program Studi Teknik Informatika UDINUS yang mencakup seluruh evolusi fitur dari versi awal hingga terkini (Revisi A-G: ditambah, diubah, dihapus), diagram konteks, DFD level 1-2, ERD, dan traceability matrix tanpa mengubah layout halaman pertama.

- [x] G1: Dokumen SKPL lengkap dibuat di docs/SKPL_KostKu.md dengan layout cover dan header halaman pertama persis template UDINUS
  CHECK: node scripts/verify-skpl-template.mjs
  EXPECT: skpl template and cover layout verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=04cf66b20f94b58c6cfb4ef8424fe44113f294410d618d8754ef52c7ea22fc9c; exit=0; EXPECT=matched; output-sha256=ec27021b0be514a903dfc6660da63645d4bab2946c0f8bcf0a71a535fa534f79; output-bytes=51; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Riwayat evolusi fitur dari versi awal hingga terkini (Revisi A-G) lengkap mendata seluruh fitur yang ditambah, diubah, dan dihapus
  CHECK: node scripts/verify-skpl-evolution.mjs
  EXPECT: skpl feature evolution history verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=5e548249f4dfd67517d91c651f33040cc593f7df344cbe0eb2a3689e715306d1; exit=0; EXPECT=matched; output-sha256=c3575469f41c2c43fc28d54c0e9bdac22c80d600de85a83c8e1a78b5356aa278; output-bytes=51; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G3: Seluruh spesifikasi kebutuhan fungsional, non-fungsional, diagram konteks, DFD Level 1, DFD Level 2, dan ERD lengkap terdefinisi
  CHECK: node scripts/verify-skpl-diagrams.mjs
  EXPECT: skpl diagrams and requirements verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cd9e12dee1e083935f2e1d10ab5e94bd6f119badc31d895afc096f4060ee7b89; exit=0; EXPECT=matched; output-sha256=7b62be1aa74db21251f4c21f50fb743552ba302ba323eb13ef7d23604971b678; output-bytes=51; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: Tabel kerunutan (traceability) fungsional vs proses DFD dan data store vs ERD terisi penuh tanpa ada placeholder kosong
  CHECK: node scripts/verify-skpl-traceability.mjs
  EXPECT: skpl traceability and integrity verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=8015dffcc585edf76bc6065b3bd03e8a2c0cbe8cbb52b84eada7ae3bf6827fc1; exit=0; EXPECT=matched; output-sha256=4b63ec63519e221d2ff0734f28d45128222024cd3bc4f57a69ac552a1d8797f5; output-bytes=52; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: Verifikasi bebas placeholder memastikan tidak ada token unreplaced seperti placeholder kurung siku di dalam dokumen SKPL
  CHECK: node scripts/verify-skpl-no-placeholders.mjs
  EXPECT: skpl placeholder scan passed with zero unreplaced tags
  EVIDENCE: automatic-evidence=v1; definition-sha256=dfba70b35f89b4b11418b066993aa43f40e9b0e0d12336eb110e121f519355f4; exit=0; EXPECT=matched; output-sha256=80a9e638e733fa386717df5371ba9a1f49bf0e656231f30468658c78bca62e38; output-bytes=55; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries
