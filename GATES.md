# Gates: Zero Error Hardening & Verification

OWNS: src/**, backend/**, scripts/**, GATES.md

Scope: Eliminate all potential runtime, compile-time, and route errors across KostKu with an ErrorBoundary, static verification, clean build, healthy API, and clean E2E audit.

- [x] G1: React Error Boundary wraps app routes and prevents blank screen crashes on unexpected errors
  CHECK: node scripts/verify-error-boundary.mjs
  EXPECT: error boundary verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=6d3dac1ad57a6466d6aae164048c5eb30849ebf42dbcd40c5dadc7a6648a07ac; exit=0; EXPECT=matched; output-sha256=25f56eb8fff83ab5b91cbb81a9ed92a21f52b704695c9e14d681e79a3d5c53e9; output-bytes=35; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G2: Static JSX icon and variable reference audit reports zero missing or undefined imports
  CHECK: node scripts/verify-static-references.mjs
  EXPECT: static reference audit passed with zero errors
  EVIDENCE: automatic-evidence=v1; definition-sha256=c9131f91c902043e9568deb17c44273dcd88df2fe6d6a815fac315a83791556b; exit=0; EXPECT=matched; output-sha256=728555086575ade380466fb1dcf2941499400101f7b315bb06c0824270400466; output-bytes=47; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G3: Production Vite build bundles all 2100+ modules with zero build or syntax errors
  CHECK: npm run build
  EXPECT: /built in [0-9.]+s/
  EVIDENCE: automatic-evidence=v1; definition-sha256=ed9d065845551754969154dde2b2b8ce4f8fee9b0438ae632a486ceba80cb2f6; exit=0; EXPECT=matched; output-sha256=02a31f2d0afc08785f0bd8a7cd606baec8a031c80e105a9e2d1c2a5639ff8956; output-bytes=709; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G4: Backend Express health check and public endpoints respond with HTTP 200 and healthy status
  CHECK: node scripts/verify-backend-health.mjs
  EXPECT: backend health verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=a11382be0406285aa077493a5ec8f03d09ababa9059cc7923adb874b23e2b81a; exit=0; EXPECT=matched; output-sha256=11846b53ebe22484f4f5b2ad6ea61f2a3c42828828cba724e75ac3ecfdacd049; output-bytes=35; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries

- [x] G5: End-to-end Puppeteer audit sweeps all 14 routes with zero console errors and zero failed requests
  CHECK: node scripts/verify-e2e-zero-errors.mjs
  EXPECT: e2e audit passed with zero console errors and zero failed requests
  EVIDENCE: automatic-evidence=v1; definition-sha256=c99c063f9fd6f60aadc646f73704e7fd53e4c3bc6d329fa985d112628aef9833; exit=0; EXPECT=matched; output-sha256=15cba3e27a5ff48a62c38287e86138b63ad2399621efdd1affe2a6917324ae89; output-bytes=67; shell=/bin/sh; cwd=/home/rena/.gemini/antigravity/scratch/kostku; path=7863ca3a5975/22 entries
