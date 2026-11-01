const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');

async function testMath() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://kostku.riuph.me', { waitUntil: 'domcontentloaded' });

  const results = await page.evaluate(async () => {
    function createReal() {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
      grad.addColorStop(0, '#f8fafc'); grad.addColorStop(0.7, '#cbd5e1'); grad.addColorStop(1, '#64748b');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.ellipse(128, 128, 70, 55, 0.2, 0, Math.PI * 2); ctx.fill();
      const imgData = ctx.getImageData(0, 0, 256, 256);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const shotNoise = (Math.random() - 0.5) * 14;
        const prnuRed = (Math.random() - 0.5) * 4;
        const prnuBlue = (Math.random() - 0.5) * 5;
        d[i] = Math.min(255, Math.max(0, d[i] + shotNoise + prnuRed));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + shotNoise));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + shotNoise + prnuBlue));
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.90);
    }

    function createAI() {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#f97316'); grad.addColorStop(0.5, '#ea580c'); grad.addColorStop(1, '#c2410c');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(128, 128, 65, 0, Math.PI * 2); ctx.fill();
      return canvas.toDataURL('image/jpeg', 0.95);
    }

    async function analyze(src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise(r => { img.onload = r; img.src = src; });
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, 256, 256);
      const d = ctx.getImageData(0, 0, 256, 256).data;
      const W = 256, H = 256;
      const gray = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const idx = i * 4;
        gray[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
      }

      let flatPixels = 0;
      let flatDefect = 0;
      let flatResidualSum = 0;

      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          const val = gray[idx];

          const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
          const gy = Math.abs(gray[idx + W] - gray[idx - W]);
          const grad = gx + gy;

          const lap = Math.abs(
            gray[(y - 1) * W + x] +
            gray[(y + 1) * W + x] +
            gray[y * W + (x - 1)] +
            gray[y * W + (x + 1)] -
            4 * val
          );

          if (grad < 14.0) {
            flatPixels++;
            flatResidualSum += lap;
            if (lap >= 1.8 && lap <= 22.0) {
              flatDefect++;
            }
          }
        }
      }

      const meanFlatNoise = flatPixels > 0 ? (flatResidualSum / flatPixels) : 0;
      const flatDefectPct = flatPixels > 0 ? Math.round((flatDefect / flatPixels) * 100) : 0;
      
      const defectScore = Math.min(100, Math.max(0, ((flatDefectPct - 25) / 45) * 100));
      const noiseScore = Math.min(100, Math.max(0, ((meanFlatNoise - 2.5) / 8.0) * 100));
      let sensorScore = Math.round(defectScore * 0.6 + noiseScore * 0.4);
      sensorScore = Math.max(6, Math.min(96, sensorScore));
      const aiProbability = 100 - sensorScore;

      const isRealCamera = flatDefectPct >= 45 && meanFlatNoise >= 4.0 && aiProbability < 50;
      const verdict = isRealCamera ? 'REAL_CAMERA' : 'AI_GENERATED';

      return {
        verdict,
        sensorScore,
        aiProbability,
        defectDensity: flatDefectPct,
        sensorNoiseScore: Number(meanFlatNoise.toFixed(2))
      };
    }

    const real = await analyze(createReal());
    const ai = await analyze(createAI());
    const stock = await analyze('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80');

    return { real, ai, stock };
  });

  console.log('Results:', JSON.stringify(results, null, 2));
  await browser.close();
}

testMath().catch(console.error);
