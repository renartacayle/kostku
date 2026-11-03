const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 RUNNING COMPREHENSIVE USER DIRECTIVES VERIFICATION...\n');

// -------------------------------------------------------------
// DIRECTIVE 1: Listrik, Denah, dan Rute dipindah ke dalam Kost Detail
// -------------------------------------------------------------
console.log('▶ [Directive 1] Checking Home.jsx: buttons removed from outside cards & toolbar...');
const homeContent = fs.readFileSync(path.join(__dirname, '../src/pages/Home.jsx'), 'utf8');

assert.strictEqual(homeContent.includes('Simulasi Listrik & Biaya'), false, 'Home.jsx still contains "Simulasi Listrik & Biaya" toolbar button!');
assert.strictEqual(homeContent.includes('⚡ Listrik'), false, 'Home.jsx still contains "⚡ Listrik" button on cards!');
assert.strictEqual(homeContent.includes('📐 Denah 2D'), false, 'Home.jsx still contains "📐 Denah 2D" button on cards!');
assert.strictEqual(homeContent.includes('↗ Rute'), false, 'Home.jsx still contains "↗ Rute" button on cards!');
assert.strictEqual(homeContent.includes('KwhUtilityCalculatorModal'), false, 'Home.jsx still imports/renders KwhUtilityCalculatorModal!');
assert.strictEqual(homeContent.includes('FloorPlanModal'), false, 'Home.jsx still imports/renders FloorPlanModal!');
console.log('   ✓ Home.jsx is clean: No electricity, floor plan, or route buttons outside.');

console.log('▶ [Directive 1] Checking KostDetail.jsx: dedicated interactive features present...');
const detailContent = fs.readFileSync(path.join(__dirname, '../src/pages/KostDetail.jsx'), 'utf8');

assert.ok(detailContent.includes('KwhUtilityCalculatorModal'), 'KostDetail.jsx does not mount KwhUtilityCalculatorModal!');
assert.ok(detailContent.includes('FloorPlanModal'), 'KostDetail.jsx does not mount FloorPlanModal!');
assert.ok(detailContent.includes('RoomFloorPlanViewer'), 'KostDetail.jsx does not use RoomFloorPlanViewer!');
assert.ok(detailContent.includes('Simulasi Biaya Token Listrik'), 'KostDetail.jsx does not have electric simulation button in utility card!');
assert.ok(detailContent.includes('Denah 2D Arsitektural Unit (Skala 1:50)'), 'KostDetail.jsx does not have dedicated Denah 2D section!');
assert.ok(detailContent.includes('Simulasi Biaya Listrik & Token PLN'), 'KostDetail.jsx does not have dedicated Simulasi Listrik section!');
assert.ok(detailContent.includes('Lokasi & Petunjuk Rute ke Kost'), 'KostDetail.jsx does not have dedicated Lokasi & Rute section!');
assert.ok(detailContent.includes('Buka Petunjuk Rute di Google Maps'), 'KostDetail.jsx does not have navigation CTA!');
assert.ok(!detailContent.includes('const RoomBlueprintSvg ='), 'KostDetail.jsx still has legacy unused RoomBlueprintSvg!');
console.log('   ✓ KostDetail.jsx contains dedicated Denah 2D, Simulasi Listrik, and Rute sections & modals.');

// -------------------------------------------------------------
// DIRECTIVE 2: Page cari kost - banner sama dengan landing page & skeleton loading dibenerin
// -------------------------------------------------------------
console.log('\n▶ [Directive 2] Checking SearchKost.jsx marketing banners & card styling...');
const searchContent = fs.readFileSync(path.join(__dirname, '../src/pages/SearchKost.jsx'), 'utf8');

assert.ok(searchContent.includes("import MarketingBanners from '../components/MarketingBanners'"), 'SearchKost.jsx does not import MarketingBanners!');
assert.ok(searchContent.includes('<MarketingBanners'), 'SearchKost.jsx does not render <MarketingBanners />!');
assert.ok(searchContent.includes('categoryBadgeStyle'), 'SearchKost.jsx does not compute categoryBadgeStyle aligned with Home.jsx!');

console.log('▶ [Directive 2] Checking KostCardSkeleton.jsx and aspect ratio...');
const skeletonContent = fs.readFileSync(path.join(__dirname, '../src/components/KostCardSkeleton.jsx'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '../src/index.css'), 'utf8');

assert.ok(skeletonContent.includes('kost-responsive-grid'), 'KostCardSkeleton.jsx does not use .kost-responsive-grid!');
assert.ok(skeletonContent.includes("aspectRatio: '4 / 3'"), 'KostCardSkeleton.jsx does not use 4:3 aspect ratio!');
assert.ok(cssContent.includes('.kost-card-image-wrapper {\n  width: 100%;\n  aspect-ratio: 4 / 3;'), '.kost-card-image-wrapper does not use aspect-ratio: 4 / 3 in index.css!');
console.log('   ✓ SearchKost.jsx banners & KostCardSkeleton layout shift fixed with 4:3 aspect ratio.');

// -------------------------------------------------------------
// DIRECTIVE 3: Validasi GMaps Owner: Harus link ke kost, jalan tanpa nama kost ditolak
// -------------------------------------------------------------
console.log('\n▶ [Directive 3] Checking Google Maps Kost URL validation...');
const { validateKostGmapsUrl } = require('../src/utils/geoUtils.js');

// Test 3.1: Reject plain street / road URL without kost name
const streetOnlyTest = validateKostGmapsUrl('https://www.google.com/maps/place/Jl.+Imam+Bonjol+No.207/@-6.98,110.4', 'Kost Permata Indah');
assert.strictEqual(streetOnlyTest.valid, false, 'Failed to reject generic street link!');
assert.ok(streetOnlyTest.message.toLowerCase().includes('ditolak'), 'Rejection message does not clearly state rejection!');
console.log('   ✓ Rejected street-only link:', streetOnlyTest.message);

// Test 3.2: Reject pure coordinates without place name
const coordsOnlyTest = validateKostGmapsUrl('https://maps.google.com/?q=-6.9826,110.4091', 'Kost Permata Indah');
assert.strictEqual(coordsOnlyTest.valid, false, 'Failed to reject pure coordinates link!');
assert.ok(coordsOnlyTest.message.toLowerCase().includes('ditolak'), 'Rejection message does not clearly state rejection!');
console.log('   ✓ Rejected coordinates-only link:', coordsOnlyTest.message);

// Test 3.3: Reject mismatching business place
const mismatchTest = validateKostGmapsUrl('https://www.google.com/maps/place/Indomaret+Point+Pemuda/@-6.98,110.4', 'Kost Permata Indah');
assert.strictEqual(mismatchTest.valid, false, 'Failed to reject mismatching place name link!');
console.log('   ✓ Rejected mismatching place link:', mismatchTest.message);

// Test 3.4: Accept matching kost place
const validKostTest = validateKostGmapsUrl('https://www.google.com/maps/place/Kost+Permata+Indah+Semarang/@-6.98,110.4', 'Kost Permata Indah');
assert.strictEqual(validKostTest.valid, true, 'Failed to accept matching kost place link!');
console.log('   ✓ Accepted matching kost place link:', validKostTest.placeName);

// Test 3.5: Accept valid maps.app.goo.gl short link
const validShortTest = validateKostGmapsUrl('https://maps.app.goo.gl/3w6k9eABC', 'Kost Permata Indah');
assert.strictEqual(validShortTest.valid, true, 'Failed to accept short link format!');
console.log('   ✓ Handled short link:', validShortTest.message);

// Check that AddPropertyModal and server.js enforce this validation
const modalContent = fs.readFileSync(path.join(__dirname, '../src/components/AddPropertyModal.jsx'), 'utf8');
assert.ok(modalContent.includes('validateKostGmapsUrl'), 'AddPropertyModal.jsx does not use validateKostGmapsUrl!');
assert.ok(modalContent.includes('gmapsValidation'), 'AddPropertyModal.jsx does not display gmapsValidation feedback!');

const serverContent = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
assert.ok(serverContent.includes('function validateKostGmapsUrl'), 'backend/server.js does not contain validateKostGmapsUrl!');
assert.ok(serverContent.includes('const gmapsCheck = validateKostGmapsUrl(gmapsUrl, kostName)'), 'backend/server.js does not enforce validateKostGmapsUrl in /api/owner/kosts!');
console.log('   ✓ AddPropertyModal and backend/server.js enforce strict Google Maps kost verification.');

console.log('\n🎉 ALL USER REQUIREMENTS VERIFIED AND PASSED 100%!\n');
