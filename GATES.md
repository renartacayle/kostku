# Gates: Master PPTX Presentation KostKu (Native PowerPoint 16:9 Deck)

OWNS: scripts/generate_pptx.py, scripts/verify-pptx-*.mjs, GATES.md

Scope: Menghasilkan presentasi PowerPoint native (.pptx) 16:9 beresolusi tinggi di Desktop yang mencakup seluruh isi SKPL KostKu untuk user dan developer (18 slide) berstandar Taste-Skill dan terverifikasi unlazy.

- [x] G1: Generator script scripts/generate_pptx.py authored with 18 slides covering dual-track user and developer SKPL content
  CHECK: node scripts/verify-pptx-generator.mjs
  EXPECT: pptx generator script verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=3626817f1c612a73a9536751ed4adc02521213eddef65cb0ffecad1ca7518eca; exit=0; EXPECT=matched; output-sha256=2cfdd8a992d2e32df483bae56149c109f7c88197bf95f8501037267df039c3c5; output-bytes=42; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Native PowerPoint file KostKu_SKPL_Presentation.pptx successfully compiled on Desktop with valid binary size
  CHECK: node scripts/verify-pptx-file-exists.mjs
  EXPECT: pptx file existence verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=eeabc86368f6d0b022a99e534330933f2e8f2d1c987e34ac512c1045a0fe8f4c; exit=0; EXPECT=matched; output-sha256=e96c9c3f66768188bbdbc12715cc2a6b59395bc5a9d4e48ac26eb23f13ae1925; output-bytes=40; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G3: Generated PPTX presentation verified to contain exactly 18 slides in widescreen 16:9 format
  CHECK: node scripts/verify-pptx-slide-count.mjs
  EXPECT: pptx slide count verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=06398225f0241a9108feeddf1b7b0a0a23e191204506e01c66d0cd70ceaea46a; exit=0; EXPECT=matched; output-sha256=44ebc25efce5e8f90366de58552f30ae8b762af10543770cc46b0229262200a3; output-bytes=88; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: PPTX presentation content verified to integrate complete dual perspectives for User and Developer tracks
  CHECK: node scripts/verify-pptx-perspectives.mjs
  EXPECT: pptx perspectives verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=ecfb9df91e33046d038c4f9d4c05661968946d8cb935ebd7da3a294e4eb4571b; exit=0; EXPECT=matched; output-sha256=784623a45bde670b38c6905e0580c92d1fb61e2e7bfb083eec819dbeed7aa11c; output-bytes=38; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: PPTX visual design verified to implement Taste-Skill bento layouts, Blue Hour theme, and colored badge pills
  CHECK: node scripts/verify-pptx-taste-design.mjs
  EXPECT: pptx taste design verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=4f653f41385889ca5f1e74a1e3ad086d43a881df6540e47302aa27c8a4cc6d86; exit=0; EXPECT=matched; output-sha256=d1e79d9a44437872325d357347b271b9ea33fced574d0b362d21383a505ff01d; output-bytes=71; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries
