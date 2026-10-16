import { execSync } from 'child_process';

try {
  const result = execSync(`python3 -c "
import pptx
prs = pptx.Presentation('/home/rena/Desktop/KostKu_SKPL_Presentation.pptx')
total_shapes = sum(len(s.shapes) for s in prs.slides)
print(total_shapes)
"`, { encoding: 'utf8' }).trim();

  const totalShapes = parseInt(result, 10);
  console.log(`Total visual shapes in PPTX: ${totalShapes}`);

  if (totalShapes < 50) {
    console.error(`FAIL: PPTX lacks visual bento shapes and card styling (${totalShapes} shapes, expected >= 50).`);
    process.exit(1);
  }

  console.log('pptx taste design verification passed');
  process.exit(0);
} catch (e) {
  console.error('FAIL checking PPTX taste design:', e.message);
  process.exit(1);
}
