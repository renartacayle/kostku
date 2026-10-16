import { execSync } from 'child_process';

try {
  const output = execSync(`python3 -c "
import pptx
prs = pptx.Presentation('/home/rena/Desktop/KostKu_SKPL_Presentation.pptx')
count = len(prs.slides)
w = round(prs.slide_width.inches, 2)
h = round(prs.slide_height.inches, 2)
print(f'{count}|{w}|{h}')
"`, { encoding: 'utf8' }).trim();

  const [count, w, h] = output.split('|');
  const slideCount = parseInt(count, 10);
  
  console.log(`PPTX slide count: ${slideCount}, dimensions: ${w}x${h} inches`);

  if (slideCount !== 18) {
    console.error(`FAIL: Expected exactly 18 slides, found ${slideCount}.`);
    process.exit(1);
  }

  if (parseFloat(w) < 13.0 || parseFloat(h) < 7.0) {
    console.error(`FAIL: Presentation is not 16:9 widescreen (${w}x${h}).`);
    process.exit(1);
  }

  console.log('pptx slide count verification passed');
  process.exit(0);
} catch (e) {
  console.error('FAIL checking PPTX slide count:', e.message);
  process.exit(1);
}
