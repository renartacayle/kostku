const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Modern, high-end SVG Logo for KostKu
// Concept: Modern geometric architectural house + smart 'K' monogram + premium gradient & glow
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <!-- Primary Brand Gradient (Royal Blue to Electric Cyan) -->
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Secondary Accent Gradient (Violet to Pink/Orange spark) -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>

    <!-- Emerald / Live Glow Gradient -->
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0284c7" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Squircle App Icon Container -->
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgGrad)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4" filter="url(#dropShadow)" />

  <!-- Inner Tech Ambient Glow Accent -->
  <circle cx="256" cy="240" r="140" fill="url(#brandGrad)" opacity="0.15" />

  <!-- Main Geometric Structure: Modern Roof & Modern 'K' Monogram -->
  <g transform="translate(0, 10)">
    <!-- Roof Peak Line (Minimalist Modern Gable) -->
    <path d="M 120 220 L 256 110 L 392 220" 
          fill="none" 
          stroke="url(#brandGrad)" 
          stroke-width="38" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <!-- Left Pillar of 'K' (Building Wall) -->
    <rect x="160" y="210" width="38" height="180" rx="19" fill="url(#brandGrad)" />

    <!-- Top Diagonal Arm of 'K' (Smart Skylight/Roof Connection) -->
    <path d="M 198 300 L 340 195" 
          fill="none" 
          stroke="url(#accentGrad)" 
          stroke-width="38" 
          stroke-linecap="round" />

    <!-- Bottom Diagonal Arm of 'K' (Entrance Ramp / Foundation) -->
    <path d="M 228 275 L 348 390" 
          fill="none" 
          stroke="url(#emeraldGrad)" 
          stroke-width="38" 
          stroke-linecap="round" />

    <!-- Modern Smart Living Center Point (Connected Living IoT Door) -->
    <circle cx="256" cy="345" r="14" fill="#38bdf8" />
    <circle cx="256" cy="345" r="22" fill="none" stroke="#38bdf8" stroke-width="3" opacity="0.6" />
  </g>

  <!-- Brand Sparkles -->
  <circle cx="370" cy="130" r="8" fill="#38bdf8" />
  <circle cx="390" cy="148" r="4" fill="#818cf8" opacity="0.8" />
</svg>
`;

async function run() {
  console.log('🎨 Generating modern brand logo...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: 512px; 
            height: 512px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: transparent; 
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);
  await new Promise(r => setTimeout(r, 600));

  const logoBuffer = await page.screenshot({ type: 'png', omitBackground: true });

  // Save to public files
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo-kostku.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-512x512.png'), logoBuffer);

  // Save to artifact directory for presentation
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'new_kostku_logo.png'), logoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), svgContent);

  console.log('✅ New KostKu logo saved to public/ and artifacts!');
  await browser.close();
}

run().catch(console.error);
