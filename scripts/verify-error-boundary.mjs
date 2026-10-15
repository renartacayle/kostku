import fs from 'fs';
import path from 'path';

const boundaryPath = path.resolve('src/components/ErrorBoundary.jsx');
const appPath = path.resolve('src/App.jsx');

if (!fs.existsSync(boundaryPath)) {
  console.error('FAIL: src/components/ErrorBoundary.jsx does not exist.');
  process.exit(1);
}

const boundaryCode = fs.readFileSync(boundaryPath, 'utf8');
if (!boundaryCode.includes('getDerivedStateFromError') || !boundaryCode.includes('componentDidCatch')) {
  console.error('FAIL: ErrorBoundary must implement getDerivedStateFromError and componentDidCatch.');
  process.exit(1);
}

const appCode = fs.readFileSync(appPath, 'utf8');
if (!appCode.includes('ErrorBoundary') || !appCode.includes('<ErrorBoundary>')) {
  console.error('FAIL: src/App.jsx does not import and wrap with ErrorBoundary.');
  process.exit(1);
}

console.log('error boundary verification passed');
process.exit(0);
