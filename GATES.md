# Gates: Template Presentasi PPT SKPL KostKu (User & Developer Unified Deck)

OWNS: docs/PPT_SKPL_KOSTKU.md, scripts/verify-ppt-*.mjs, scripts/generate_ppt_deck.mjs, GATES.md

Scope: Menyusun template presentasi PPT berformat Markdown (.md) dengan panjang antara 15 hingga 20 halaman/slide yang merangkum isi SKPL KostKu dari perspektif User (pemilik, penyewa, mitra) dan Developer (arsitektur, basis data, DFD, keamanan) dalam satu dokumen terpadu berstandar Taste-Skill, serta mengekspornya ke Desktop.

- [x] G1: Slide deck Markdown file docs/PPT_SKPL_KOSTKU.md created with exact slide count between 15 and 20 slides
  CHECK: node scripts/verify-ppt-slide-count.mjs
  EXPECT: ppt slide count verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=0a48f40f6a7dc22a50b984e202a69702e95bcb20da4aafaed08c54935e4f47b4; exit=0; EXPECT=matched; output-sha256=d5fd33640ac6881c8ace83cd81f3096e6e20c7dcf78c9b0a5010d32132e0e568; output-bytes=53; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Slide deck integrates dual perspectives covering Track User and Track Developer in one cohesive deck
  CHECK: node scripts/verify-ppt-perspectives.mjs
  EXPECT: ppt dual perspectives verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=3119cfdd9cdd7876b1ce1c4bfae1f0295d16624ba21bfefeff5d9d76fe191a4c; exit=0; EXPECT=matched; output-sha256=d75365ef7be008a790657793e199722067fa99103e5d0c713aa2fab8e97c80f7; output-bytes=42; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G3: Slide deck adheres to Taste-Skill visual design system with Blue Hour palette, bento layouts, and badge tags
  CHECK: node scripts/verify-ppt-taste-styling.mjs
  EXPECT: ppt taste styling verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=6643a5275802e409d608ecf9d9bd755bf171fc8788b8debbb7f3da526ba72f5b; exit=0; EXPECT=matched; output-sha256=daffeeea300b3c296a910ba0c2d20ef2ec7e3adb9dee0583b7eceb7b8fda2265; output-bytes=38; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: Interactive presentation viewer engine scripts/generate_ppt_deck.mjs compiles standalone slide deck with keyboard controls
  CHECK: node scripts/verify-ppt-interactive-engine.mjs
  EXPECT: ppt interactive engine verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=3ea1418cddb90fd1e8b9ff52db060edb8c7bd113521d5a03e9cfaa49f2702485; exit=0; EXPECT=matched; output-sha256=86174fa8b8068cb88fcb9b9c07af8b8fd4ffbd0d0b990504d3bf66c0fb902199; output-bytes=43; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: Presentation files successfully copied and verified on Desktop as Markdown and interactive HTML slide deck
  CHECK: node scripts/verify-ppt-desktop-exports.mjs
  EXPECT: ppt desktop exports verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=e2d8b1c722f9b4a188f88d904745241182fb468f8aeb2fa7278afd54ca2b8a76; exit=0; EXPECT=matched; output-sha256=0a58bc9b79397e6b12fd46d7b9d612e6b8d8be3e3402e787c0d6138884abf132; output-bytes=40; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries
