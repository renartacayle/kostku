import { execSync } from 'child_process';

try {
  const allText = execSync(`python3 -c "
import pptx
prs = pptx.Presentation('/home/rena/Desktop/KostKu_SKPL_Presentation.pptx')
text_chunks = []
for slide in prs.slides:
    for shape in slide.shapes:
        if shape.has_text_frame:
            text_chunks.append(shape.text_frame.text)
print(' '.join(text_chunks))
"`, { encoding: 'utf8' });

  const requiredTokens = [
    'Pemilik',
    'Penghuni',
    'QRIS',
    'Sundul Kost',
    'Mitra',
    'Utilitas',
    'Monorepo',
    'React',
    'Express',
    'DFD',
    'ERD',
    'NIK'
  ];

  for (const token of requiredTokens) {
    if (!allText.toLowerCase().includes(token.toLowerCase())) {
      console.error(`FAIL: Missing required topic token "${token}" in PPTX.`);
      process.exit(1);
    }
  }

  console.log('pptx perspectives verification passed');
  process.exit(0);
} catch (e) {
  console.error('FAIL checking PPTX perspectives:', e.message);
  process.exit(1);
}
