import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DESIGN_DIR = path.dirname(new URL(import.meta.url).pathname);
const OUT_FILE = path.join(DESIGN_DIR, 'kasir.figcraft');
const SCRIPT_JSON = path.join(DESIGN_DIR, '.kasir_commands.tmp.json');

/**
 * Modular command builder for storytold/figcraft CLI (`figcraft-cli run`).
 * Generates a 100% local, token-driven KostKu Kasir design system (Light + Dark variables)
 * and 5 responsive Auto-Layout screens ready for Dev Mode (`inspect.code`) & visual review.
 */
class FigCraftBuilder {
  constructor() {
    this.commands = [];
    this.seq = 0;
  }

  nextRef(prefix = 'n') {
    this.seq += 1;
    return `${prefix}_${this.seq}`;
  }

  push(command, params, asName) {
    const step = { command, params };
    if (asName) step.as = asName;
    this.commands.push(step);
    return asName ? { $ref: asName, field: 'id' } : null;
  }

  createCollection(name, modes) {
    return this.push('variable.createCollection', { name, modes }, this.nextRef('col'));
  }

  createColorVars(collectionRef, tokenMap) {
    for (const [varName, values] of Object.entries(tokenMap)) {
      this.push('variable.create', {
        collection: collectionRef,
        name: varName,
        type: 'color',
        values,
      }, this.nextRef('var'));
    }
  }

  frame(name, width, height, props = {}, parent = undefined, asPrefix = 'frm') {
    const params = { name, width, height, props };
    if (parent) params.parent = parent;
    return this.push('frame.create', params, this.nextRef(asPrefix));
  }

  rect(name, width, height, props = {}, parent = undefined) {
    const params = { type: 'rectangle', name, width, height, props };
    if (parent) params.parent = parent;
    return this.push('node.create', params, this.nextRef('rect'));
  }

  circle(name, size, props = {}, parent = undefined) {
    const params = { type: 'ellipse', name, width: size, height: size, props };
    if (parent) params.parent = parent;
    return this.push('node.create', params, this.nextRef('dot'));
  }

  text(parent, text, {
    size = 13,
    weight = 'Regular',
    color = { $var: 'ink-primary' },
    align = 'left',
    fillH = true,
    lineHeight = '140%',
    maxLines = undefined,
    name = undefined,
  } = {}) {
    const props = {
      fontFamily: 'Inter',
      fontStyle: weight,
      fontSize: size,
      lineHeight,
      fill: color,
      textAlign: align,
    };
    if (fillH) {
      props.sizingH = 'fill';
      props.textAutoResize = 'height';
    } else {
      props.textAutoResize = 'widthAndHeight';
    }
    if (maxLines) props.maxLines = maxLines;

    const params = { type: 'text', parent, text, props };
    if (name) params.name = name;
    return this.push('node.create', params, this.nextRef('txt'));
  }

  addShadow(targetRef) {
    this.push('effect.add', { ids: [targetRef], type: 'dropShadow' });
  }

  badge(parent, label, { bg, fg, size = 10 } = {}) {
    const pill = this.frame(`Badge/${label}`, 64, 22, {
      fill: bg,
      cornerRadius: 9999,
      layout: 'horizontal',
      padding: [3, 9, 3, 9],
      mainAlign: 'center',
      crossAlign: 'center',
      sizingH: 'hug',
      sizingV: 'hug',
    }, parent, 'bdg');
    this.text(pill, label, {
      size,
      weight: 'SemiBold',
      color: fg,
      fillH: false,
      lineHeight: '120%',
    });
    return pill;
  }

  pillButton(parent, label, {
    bg = { $var: 'brand-primary' },
    fg = '#ffffff',
    stroke = null,
    height = 40,
    radius = 12,
    fillH = true,
    weight = 'SemiBold',
    size = 13,
  } = {}) {
    const btn = this.frame(`Btn/${label}`, 120, height, {
      fill: bg,
      ...(stroke ? { stroke, strokeWeight: 1, strokeAlign: 'inside' } : {}),
      cornerRadius: radius,
      layout: 'horizontal',
      padding: [0, 14, 0, 14],
      mainAlign: 'center',
      crossAlign: 'center',
      sizingH: fillH ? 'fill' : 'hug',
      sizingV: 'fixed',
    }, parent, 'btn');
    this.text(btn, label, {
      size,
      weight,
      color: fg,
      align: 'center',
      fillH: false,
      lineHeight: '120%',
    });
    return btn;
  }
}

const V = (name) => ({ $var: name });

function buildMobileTopBar(b, parent, { subtitle = 'Owner Akun #999 • Shift Pagi', badgeLabel = 'Shift Aktif' } = {}) {
  const bar = b.frame('TopBar', 390, 60, {
    fill: V('bg-surface'),
    stroke: V('border-subtle'),
    strokeWeight: 1,
    strokeSides: [false, false, true, false],
    layout: 'horizontal',
    padding: [10, 16, 10, 16],
    gap: 10,
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, parent, 'top');

  const brand = b.frame('BrandGroup', 200, 40, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, bar);

  const logo = b.frame('LogoMark', 34, 34, {
    fill: V('brand-primary'),
    cornerRadius: 10,
    layout: 'vertical',
    mainAlign: 'center',
    crossAlign: 'center',
    sizingH: 'fixed',
    sizingV: 'fixed',
  }, brand);
  b.text(logo, 'K', { size: 16, weight: 'Bold', color: '#ffffff', fillH: false, align: 'center' });

  const titles = b.frame('TitleCol', 160, 36, {
    fill: 'none',
    layout: 'vertical',
    gap: 1,
    sizingH: 'fill',
    sizingV: 'hug',
  }, brand);
  b.text(titles, 'KostKu Kasir', { size: 15, weight: 'Bold', color: V('ink-primary'), lineHeight: '120%' });
  b.text(titles, subtitle, { size: 11, weight: 'Medium', color: V('ink-muted'), lineHeight: '120%' });

  b.badge(bar, badgeLabel, { bg: V('status-success-tint'), fg: V('status-success'), size: 10 });
  return bar;
}

function buildMobileBottomNav(b, parent, activeSlot = 'kasir') {
  const nav = b.frame('MobileBottomNavbar', 390, 68, {
    fill: V('bg-surface'),
    stroke: V('border-subtle'),
    strokeWeight: 1,
    strokeSides: [true, false, false, false],
    layout: 'horizontal',
    padding: [6, 8, 8, 8],
    gap: 4,
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, parent, 'bnav');

  const slots = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'dapur', label: 'Dapur' },
    { key: 'kasir', label: 'Kasir', isFab: true },
    { key: 'meja', label: 'Meja QR' },
    { key: 'kelola', label: 'Kelola' },
  ];

  for (const slot of slots) {
    const isActive = activeSlot === slot.key;
    const item = b.frame(`NavItem/${slot.label}`, 70, 52, {
      fill: 'none',
      layout: 'vertical',
      gap: 3,
      mainAlign: 'center',
      crossAlign: 'center',
      sizingH: 'fill',
      sizingV: 'fixed',
    }, nav);

    if (slot.isFab) {
      const fab = b.frame('CenterKasirFAB', 40, 32, {
        fill: isActive ? V('brand-primary') : V('brand-tint'),
        cornerRadius: 16,
        layout: 'vertical',
        mainAlign: 'center',
        crossAlign: 'center',
        sizingH: 'fixed',
        sizingV: 'fixed',
      }, item);
      b.text(fab, 'POS', {
        size: 10,
        weight: 'Bold',
        color: isActive ? '#ffffff' : V('brand-primary'),
        fillH: false,
      });
    } else {
      b.rect(`Dot/${slot.key}`, 18, 18, {
        fill: isActive ? V('brand-primary') : V('bg-slate-200'),
        cornerRadius: 6,
      }, item);
    }

    b.text(item, slot.label, {
      size: 10,
      weight: isActive ? 'Bold' : 'Medium',
      color: isActive ? V('brand-primary') : V('ink-muted'),
      align: 'center',
      fillH: true,
      lineHeight: '115%',
    });
  }
  return nav;
}

function buildProductCard(b, parent, { name, category, price, imgBg, inStock = '99', selectedQty = 0 }) {
  const card = b.frame(`ProductCard/${name}`, 172, 182, {
    fill: V('bg-surface'),
    stroke: selectedQty > 0 ? V('brand-primary') : V('border-subtle'),
    strokeWeight: selectedQty > 0 ? 1.5 : 1,
    strokeAlign: 'inside',
    cornerRadius: 14,
    layout: 'vertical',
    padding: 8,
    gap: 6,
    sizingH: 'fill',
    sizingV: 'hug',
  }, parent, 'pcard');

  const thumb = b.frame('PhotoSlot', 156, 78, {
    fill: imgBg,
    cornerRadius: 10,
    layout: 'horizontal',
    padding: 6,
    mainAlign: 'spaceBetween',
    crossAlign: 'min',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, card);
  b.badge(thumb, category, { bg: '#ffffff', fg: V('ink-primary'), size: 9 });
  b.badge(thumb, `${inStock}`, { bg: V('status-success-tint'), fg: V('status-success'), size: 9 });

  b.text(card, name, { size: 12, weight: 'SemiBold', color: V('ink-primary'), maxLines: 2, lineHeight: '125%' });
  b.text(card, price, { size: 13, weight: 'Bold', color: V('brand-primary'), lineHeight: '120%' });

  b.pillButton(card, selectedQty > 0 ? `Di Keranjang (${selectedQty})` : '+ Tambah', {
    bg: selectedQty > 0 ? V('brand-tint') : V('brand-primary'),
    fg: selectedQty > 0 ? V('brand-primary') : '#ffffff',
    height: 30,
    radius: 8,
    size: 11,
  });
  return card;
}

function buildFormField(b, parent, { label, value, placeholder = false, multiline = false, errorNote = null, extraTag = null }) {
  const field = b.frame(`Field/${label}`, 326, multiline ? 82 : 62, {
    fill: 'none',
    layout: 'vertical',
    gap: 5,
    sizingH: 'fill',
    sizingV: 'hug',
  }, parent);

  const labelRow = b.frame('LabelRow', 326, 18, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, field);
  b.text(labelRow, label, { size: 11, weight: 'Bold', color: V('ink-secondary'), fillH: false });
  if (extraTag) b.badge(labelRow, extraTag, { bg: V('brand-tint'), fg: V('brand-primary'), size: 9 });

  const box = b.frame('InputBox', 326, multiline ? 56 : 38, {
    fill: V('bg-subtle'),
    stroke: errorNote ? V('status-danger') : V('border-subtle'),
    strokeWeight: 1,
    strokeAlign: 'inside',
    cornerRadius: 10,
    layout: 'horizontal',
    padding: [9, 12, 9, 12],
    crossAlign: multiline ? 'min' : 'center',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, field);
  b.text(box, value, {
    size: 12,
    weight: placeholder ? 'Regular' : 'Medium',
    color: placeholder ? V('ink-muted') : V('ink-primary'),
    lineHeight: '130%',
  });
  return field;
}

function buildKasirScreens() {
  const b = new FigCraftBuilder();

  // 1. Design Token Variables (Light + Dark Modes)
  const tokensCol = b.createCollection('KostKu Kasir Tokens', ['Light', 'Dark']);
  b.createColorVars(tokensCol, {
    'bg-main': { Light: '#f1f5f9', Dark: '#080d1a' },
    'bg-surface': { Light: '#ffffff', Dark: '#0e1726' },
    'bg-subtle': { Light: '#f8fafc', Dark: '#131f37' },
    'bg-slate-200': { Light: '#e2e8f0', Dark: '#1e293b' },
    'ink-primary': { Light: '#0f172a', Dark: '#f8fafc' },
    'ink-secondary': { Light: '#475569', Dark: '#94a3b8' },
    'ink-muted': { Light: '#64748b', Dark: '#94a3b8' },
    'brand-primary': { Light: '#2563eb', Dark: '#2563eb' },
    'brand-dark': { Light: '#1d4ed8', Dark: '#1d4ed8' },
    'brand-tint': { Light: '#eff6ff', Dark: '#172554' },
    'accent-amber': { Light: '#d97706', Dark: '#f59e0b' },
    'accent-amber-tint': { Light: '#fffbeb', Dark: '#2e1e08' },
    'status-success': { Light: '#16a34a', Dark: '#10b981' },
    'status-success-tint': { Light: '#f0fdf4', Dark: '#06281c' },
    'status-danger': { Light: '#dc2626', Dark: '#ef4444' },
    'status-danger-tint': { Light: '#fef2f2', Dark: '#2d0f14' },
    'border-subtle': { Light: '#cbd5e1', Dark: '#1e293b' },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN 1: Mobile - Kasir POS (390x844)
  // ═══════════════════════════════════════════════════════════════════════
  const s1 = b.frame('Mobile - Kasir POS (390x844)', 390, 844, {
    x: 0,
    y: 0,
    fill: V('bg-main'),
    layout: 'vertical',
    clip: true,
    devStatus: 'readyForDev',
  });
  buildMobileTopBar(b, s1);

  const s1Body = b.frame('POSContent', 390, 716, {
    fill: 'none',
    layout: 'vertical',
    padding: [12, 12, 10, 12],
    gap: 10,
    sizingH: 'fill',
    sizingV: 'fill',
  }, s1);

  // Search box
  const searchBar = b.frame('SearchInput', 366, 40, {
    fill: V('bg-surface'),
    stroke: V('border-subtle'),
    strokeWeight: 1,
    cornerRadius: 12,
    layout: 'horizontal',
    padding: [0, 12, 0, 12],
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, s1Body);
  b.text(searchBar, 'Cari menu, minuman, atau snack...', { size: 12, color: V('ink-muted'), fillH: false });
  b.badge(searchBar, 'Akun #999', { bg: V('brand-tint'), fg: V('brand-primary'), size: 10 });

  // Category Pills Row (includes private per-account category)
  const catRow = b.frame('CategoryPillsRow', 366, 32, {
    fill: 'none',
    layout: 'horizontal',
    gap: 6,
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, s1Body);
  b.pillButton(catRow, 'Semua (6)', { bg: V('brand-primary'), fg: '#ffffff', height: 28, radius: 9999, fillH: false, size: 11 });
  b.pillButton(catRow, 'Makanan (3)', { bg: V('bg-surface'), fg: V('ink-secondary'), stroke: V('border-subtle'), height: 28, radius: 9999, fillH: false, size: 11 });
  b.pillButton(catRow, 'Spesial Toko A (1)', { bg: V('brand-tint'), fg: V('brand-primary'), stroke: V('brand-primary'), height: 28, radius: 9999, fillH: false, size: 11 });

  // 2-column grid implemented cleanly as 2 responsive rows (percentage-safe flex)
  const row1 = b.frame('CatalogRow1', 366, 186, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s1Body);
  buildProductCard(b, row1, { name: 'Es Kopi Aren Spesial', category: 'Spesial Toko A', price: 'Rp 28.000', imgBg: '#fef3c7', inStock: '99', selectedQty: 1 });
  buildProductCard(b, row1, { name: 'Mie Gacoan Level 2', category: 'Makanan', price: 'Rp 13.000', imgBg: '#dbeafe', inStock: '99', selectedQty: 0 });

  const row2 = b.frame('CatalogRow2', 366, 186, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s1Body);
  buildProductCard(b, row2, { name: 'Nasi Goreng Telur', category: 'Makanan', price: 'Rp 18.000', imgBg: '#e0e7ff', inStock: '99', selectedQty: 1 });
  buildProductCard(b, row2, { name: 'Es Teh Manis Jumbo', category: 'Minuman', price: 'Rp 5.000', imgBg: '#dcfce7', inStock: '99', selectedQty: 0 });

  // Sticky Bottom Cart Strip
  const cartBar = b.frame('StickyCartStrip', 366, 56, {
    fill: V('brand-dark'),
    cornerRadius: 14,
    layout: 'horizontal',
    padding: [10, 14, 10, 14],
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, s1Body);
  const cartLeft = b.frame('CartSummaryText', 180, 36, {
    fill: 'none',
    layout: 'vertical',
    gap: 1,
    sizingH: 'fill',
    sizingV: 'hug',
  }, cartLeftParentFix(cartBar));
  function cartLeftParentFix(p) { return p; }
  b.text(cartLeft, '2 Item di Keranjang', { size: 11, weight: 'Medium', color: '#bfdbfe', lineHeight: '120%' });
  b.text(cartLeft, 'Total Rp 46.000', { size: 15, weight: 'Bold', color: '#ffffff', lineHeight: '120%' });
  b.pillButton(cartBar, 'Bayar ->', { bg: '#ffffff', fg: V('brand-dark'), height: 34, radius: 10, fillH: false, size: 12 });

  buildMobileBottomNav(b, s1, 'kasir');

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN 2: Mobile - Pusat Kelola Sheet 1-Kolom (390x844)
  // ═══════════════════════════════════════════════════════════════════════
  const s2 = b.frame('Mobile - Pusat Kelola Sheet (390x844)', 390, 844, {
    x: 450,
    y: 0,
    fill: '#0f172a',
    layout: 'vertical',
    mainAlign: 'max',
    clip: true,
    devStatus: 'readyForDev',
  });

  const s2BackdropHint = b.frame('BackdropTopInfo', 390, 110, {
    fill: 'none',
    layout: 'vertical',
    padding: [28, 20, 12, 20],
    gap: 4,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s2);
  b.text(s2BackdropHint, 'KostKu Kasir • Overlay Sheet', { size: 11, weight: 'SemiBold', color: '#94a3b8' });
  b.text(s2BackdropHint, '1-Kolom Full Width (Anti Over Sideways)', { size: 12, weight: 'Medium', color: '#cbd5e1' });

  const sheet = b.frame('PusatKelolaSheet', 390, 666, {
    fill: V('bg-surface'),
    cornerRadius: [24, 24, 0, 0],
    layout: 'vertical',
    padding: [12, 16, 16, 16],
    gap: 10,
    sizingH: 'fill',
    sizingV: 'fill',
  }, s2);

  // Drag pill centered
  const handleWrap = b.frame('DragHandleWrap', 358, 8, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'center',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, sheet);
  b.rect('DragPill', 42, 4, { fill: '#cbd5e1', cornerRadius: 9999 }, handleWrap);

  const sheetHeader = b.frame('SheetHeader', 358, 46, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, sheet);
  const shLeft = b.frame('SheetTitleCol', 280, 42, {
    fill: 'none',
    layout: 'vertical',
    gap: 2,
    sizingH: 'fill',
    sizingV: 'hug',
  }, sheetHeader);
  b.text(shLeft, 'Pusat Kelola & Fitur Toko', { size: 15, weight: 'Bold', color: V('ink-primary'), lineHeight: '125%' });
  b.text(shLeft, 'Semua modul toko tampil 100% lebar layar tanpa terpotong.', { size: 11, color: V('ink-muted'), lineHeight: '130%' });
  b.pillButton(sheetHeader, 'X', { bg: V('bg-main'), fg: V('ink-secondary'), height: 30, radius: 9999, fillH: false, size: 11 });

  // Highlighted Tambah Menu Baru CTA moved cleanly inside Kelola
  const addMenuCard = b.frame('Item/TambahMenuBaru', 358, 64, {
    fill: V('brand-tint'),
    stroke: V('brand-primary'),
    strokeWeight: 1.5,
    cornerRadius: 14,
    layout: 'horizontal',
    padding: [12, 14, 12, 14],
    gap: 12,
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, sheet);
  const addMenuIcon = b.frame('IconBox', 38, 38, {
    fill: V('brand-primary'),
    cornerRadius: 10,
    layout: 'vertical',
    mainAlign: 'center',
    crossAlign: 'center',
    sizingH: 'fixed',
    sizingV: 'fixed',
  }, addMenuCard);
  b.text(addMenuIcon, '+', { size: 18, weight: 'Bold', color: '#ffffff', fillH: false, align: 'center' });
  const addMenuCopy = b.frame('CopyCol', 210, 38, {
    fill: 'none',
    layout: 'vertical',
    gap: 2,
    sizingH: 'fill',
    sizingV: 'hug',
  }, addMenuCard);
  b.text(addMenuCopy, 'Tambah Menu Baru', { size: 13, weight: 'Bold', color: V('brand-dark'), lineHeight: '125%' });
  b.text(addMenuCopy, 'Input nama, harga, deskripsi & foto produk wajib', { size: 11, color: V('brand-primary'), lineHeight: '125%' });
  b.badge(addMenuCard, 'Menu', { bg: V('brand-primary'), fg: '#ffffff', size: 10 });

  const kelolaItems = [
    ['Dapur (KDS)', 'Checklist antrean masak real-time', '2 Order', V('accent-amber-tint'), V('accent-amber')],
    ['Meja & Barcode QR', 'Cetak QR & denah meja • 5 meja', '5 Meja', V('brand-tint'), V('brand-primary')],
    ['Gudang & Resep', 'Pantau bahan baku menipis secara inline', '4! Menipis', V('status-danger-tint'), V('status-danger')],
    ['Promo Makanan', 'Atur kode diskon & kuota promo toko', null, null, null],
    ['Statistik Keuangan', 'Grafik performa kasir & margin menu', null, null, null],
    ['Kelola Karyawan', 'Shift kasir & staf akses kategori privat', null, null, null],
  ];

  for (const [title, desc, badgeTxt, bBg, bFg] of kelolaItems) {
    const row = b.frame(`KelolaItem/${title}`, 358, 58, {
      fill: V('bg-subtle'),
      stroke: V('border-subtle'),
      strokeWeight: 1,
      cornerRadius: 12,
      layout: 'horizontal',
      padding: [10, 12, 10, 12],
      gap: 10,
      mainAlign: 'spaceBetween',
      crossAlign: 'center',
      sizingH: 'fill',
      sizingV: 'hug',
    }, sheet);
    b.rect('LeadIcon', 32, 32, { fill: V('bg-surface'), stroke: V('border-subtle'), strokeWeight: 1, cornerRadius: 9 }, row);
    const col = b.frame('RowCopy', 200, 34, {
      fill: 'none',
      layout: 'vertical',
      gap: 2,
      sizingH: 'fill',
      sizingV: 'hug',
    }, row);
    b.text(col, title, { size: 13, weight: 'SemiBold', color: V('ink-primary'), lineHeight: '125%' });
    b.text(col, desc, { size: 11, color: V('ink-muted'), lineHeight: '125%' });
    if (badgeTxt) b.badge(row, badgeTxt, { bg: bBg, fg: bFg, size: 10 });
  }

  buildMobileBottomNav(b, s2, 'kelola');

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN 3: Mobile - Modal Tambah Menu (4 Field Wajib + Akun Terisolasi)
  // ═══════════════════════════════════════════════════════════════════════
  const s3 = b.frame('Mobile - Modal Tambah Menu (390x844)', 390, 844, {
    x: 900,
    y: 0,
    fill: '#0f172a',
    layout: 'vertical',
    padding: 16,
    mainAlign: 'center',
    crossAlign: 'center',
    clip: true,
    devStatus: 'readyForDev',
  });

  const modal = b.frame('ModalTambahMenu', 358, 760, {
    fill: V('bg-surface'),
    cornerRadius: 20,
    layout: 'vertical',
    padding: 16,
    gap: 12,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s3);
  b.addShadow(modal);

  const modalHdr = b.frame('ModalHeader', 326, 48, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, modal);
  const mHdrCopy = b.frame('TitleWrap', 260, 44, {
    fill: 'none',
    layout: 'vertical',
    gap: 2,
    sizingH: 'fill',
    sizingV: 'hug',
  }, modalHdr);
  b.text(mHdrCopy, 'Tambah Menu Baru', { size: 16, weight: 'Bold', color: V('ink-primary'), lineHeight: '120%' });
  b.text(mHdrCopy, 'Wajib isi nama, harga, deskripsi & foto asli (tanpa preset).', { size: 11, color: V('ink-muted'), lineHeight: '130%' });
  b.pillButton(modalHdr, 'X', { bg: V('bg-main'), fg: V('ink-secondary'), height: 30, radius: 9999, fillH: false, size: 11 });

  buildFormField(b, modal, {
    label: '1. Nama Menu *',
    value: 'Es Kopi Aren Spesial',
  });

  // Category section isolated per owner account & staff
  const catSection = b.frame('Field/KategoriPrivat', 326, 98, {
    fill: 'none',
    layout: 'vertical',
    gap: 6,
    sizingH: 'fill',
    sizingV: 'hug',
  }, modal);
  const catLabel = b.frame('CatLabelRow', 326, 18, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, catSection);
  b.text(catLabel, '2. Kategori Akun #999 & Staf', { size: 11, weight: 'Bold', color: V('ink-secondary'), fillH: false });
  b.badge(catLabel, 'Terisolasi', { bg: V('status-success-tint'), fg: V('status-success'), size: 9 });

  const catInputs = b.frame('CatDropdownAndNew', 326, 38, {
    fill: 'none',
    layout: 'horizontal',
    gap: 8,
    sizingH: 'fill',
    sizingV: 'fixed',
  }, catSection);
  const selectBox = b.frame('SelectCategory', 190, 38, {
    fill: V('bg-subtle'),
    stroke: V('border-subtle'),
    strokeWeight: 1,
    cornerRadius: 10,
    layout: 'horizontal',
    padding: [0, 10, 0, 10],
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'fixed',
  }, catInputs);
  b.text(selectBox, 'Spesial Toko A', { size: 12, weight: 'SemiBold', color: V('ink-primary'), fillH: false });
  b.text(selectBox, 'v', { size: 11, color: V('ink-muted'), fillH: false });
  b.pillButton(catInputs, '+ Kategori', { bg: V('brand-tint'), fg: V('brand-primary'), height: 38, radius: 10, fillH: false, size: 11 });
  b.text(catSection, 'Kategori & menu hanya tampil di Owner #999 dan stafnya.', { size: 10, color: V('ink-muted'), lineHeight: '125%' });

  // Harga & Stok 2-column compact row
  const priceRow = b.frame('PriceAndStockRow', 326, 62, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    sizingH: 'fill',
    sizingV: 'hug',
  }, modal);
  buildFormField(b, priceRow, { label: '3. Harga Jual (Rp) *', value: '28000' });
  buildFormField(b, priceRow, { label: 'Stok Harian', value: '99' });

  buildFormField(b, modal, {
    label: '4. Deskripsi Produk *',
    value: 'Kopi susu gula aren premium dengan espresso fresh roasted.',
    multiline: true,
  });

  // Upload Photo Box (NO "Atau Pilih Foto HD Siap Pakai" presets!)
  const uploadBox = b.frame('Field/FotoProdukWajib', 326, 114, {
    fill: V('bg-subtle'),
    stroke: V('brand-primary'),
    strokeWeight: 1.5,
    dashes: [6, 4],
    cornerRadius: 12,
    layout: 'vertical',
    padding: 12,
    gap: 6,
    mainAlign: 'center',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, modal);
  b.badge(uploadBox, '5. Foto Produk Asli * (Wajib Upload)', { bg: V('brand-tint'), fg: V('brand-primary'), size: 10 });
  b.text(uploadBox, 'Ambil Foto Kamera / Galeri HP (Max 5MB)', { size: 12, weight: 'Bold', color: V('ink-primary'), align: 'center' });
  b.text(uploadBox, 'JPG / PNG / WebP • Dikompresi otomatis sebelum simpan', { size: 10, color: V('ink-muted'), align: 'center' });

  // Inline Validation Banner above CTA
  const valBanner = b.frame('Alert/ValidationError', 326, 38, {
    fill: V('status-danger-tint'),
    stroke: V('status-danger'),
    strokeWeight: 1,
    cornerRadius: 10,
    layout: 'horizontal',
    padding: [8, 12, 8, 12],
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, modal);
  b.text(valBanner, 'Validasi noValidate aktif — error terlihat jelas sebelum simpan.', { size: 11, weight: 'SemiBold', color: V('status-danger') });

  // Action Buttons Row
  const actions = b.frame('ModalActions', 326, 42, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    sizingH: 'fill',
    sizingV: 'fixed',
  }, modal);
  b.pillButton(actions, 'Batal', { bg: V('bg-main'), fg: V('ink-secondary'), height: 42, radius: 12, size: 13 });
  b.pillButton(actions, 'Simpan Menu', { bg: V('brand-primary'), fg: '#ffffff', height: 42, radius: 12, size: 13 });

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN 4: Mobile - Dashboard Kasir & Stok Menipis Inline (390x844)
  // ═══════════════════════════════════════════════════════════════════════
  const s4 = b.frame('Mobile - Dashboard & Stok Inline (390x844)', 390, 844, {
    x: 1350,
    y: 0,
    fill: V('bg-main'),
    layout: 'vertical',
    clip: true,
    devStatus: 'readyForDev',
  });
  buildMobileTopBar(b, s4, { subtitle: 'Dashboard Shift • Opening Cash', badgeLabel: 'Terbuka' });

  const s4Body = b.frame('DashboardBody', 390, 716, {
    fill: 'none',
    layout: 'vertical',
    padding: [12, 14, 12, 14],
    gap: 12,
    sizingH: 'fill',
    sizingV: 'fill',
  }, s4);

  // Shift Hero Card
  const shiftCard = b.frame('ShiftOpeningCard', 362, 142, {
    fill: V('brand-dark'),
    cornerRadius: 16,
    layout: 'vertical',
    padding: 16,
    gap: 10,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s4Body);
  b.text(shiftCard, 'SHIFT KASIR AKTIF • SESI PAGI', { size: 10, weight: 'Bold', color: '#bfdbfe' });
  b.text(shiftCard, 'Modal Awal: Rp 500.000', { size: 20, weight: 'Bold', color: '#ffffff', lineHeight: '120%' });
  b.text(shiftCard, 'Kasir: Rina • Opening 08:00 WIB • Laci Terverifikasi', { size: 11, color: '#dbeafe' });
  const shiftBtns = b.frame('ShiftButtons', 330, 36, {
    fill: 'none',
    layout: 'horizontal',
    gap: 8,
    sizingH: 'fill',
    sizingV: 'fixed',
  }, shiftCard);
  b.pillButton(shiftBtns, 'Kas Keluar (Petty)', { bg: '#ffffff', fg: V('brand-dark'), height: 36, radius: 10, size: 11 });
  b.pillButton(shiftBtns, 'Tutup Shift', { bg: V('accent-amber'), fg: '#ffffff', height: 36, radius: 10, size: 11 });

  // KPI Percentage Grid Row (50% / 50%)
  const kpiRow = b.frame('KPIGridRow', 362, 82, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s4Body);
  for (const [kTitle, kVal, kSub] of [
    ['Omzet Hari Ini', 'Rp 1.480.000', '+18% vs kemarin'],
    ['Total Transaksi', '42 Order', 'QRIS 64% • Tunai 36%'],
  ]) {
    const tile = b.frame(`KPI/${kTitle}`, 176, 82, {
      fill: V('bg-surface'),
      stroke: V('border-subtle'),
      strokeWeight: 1,
      cornerRadius: 14,
      layout: 'vertical',
      padding: 12,
      gap: 3,
      sizingH: 'fill',
      sizingV: 'hug',
    }, kpiRow);
    b.text(tile, kTitle, { size: 11, color: V('ink-muted') });
    b.text(tile, kVal, { size: 16, weight: 'Bold', color: V('ink-primary'), lineHeight: '120%' });
    b.text(tile, kSub, { size: 10, weight: 'Medium', color: V('status-success') });
  }

  // INLINE Stock Alert Panel (Replaced annoying popup!)
  const stockInline = b.frame('InlineStokMenipisPanel', 362, 236, {
    fill: V('accent-amber-tint'),
    stroke: V('accent-amber'),
    strokeWeight: 1.5,
    cornerRadius: 16,
    layout: 'vertical',
    padding: 14,
    gap: 10,
    sizingH: 'fill',
    sizingV: 'hug',
  }, s4Body);
  const stHdr = b.frame('StockAlertHeader', 334, 28, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, stockInline);
  b.text(stHdr, 'Peringatan Stok Menipis (Inline)', { size: 13, weight: 'Bold', color: V('accent-amber'), fillH: false });
  b.badge(stHdr, 'Bukan Pop-Up!', { bg: '#ffffff', fg: V('accent-amber'), size: 10 });
  b.text(stockInline, 'Ditampilkan rapi di dalam halaman agar tidak memblokir kasir saat melayani.', { size: 11, color: V('ink-secondary'), lineHeight: '130%' });

  for (const [ingName, rem] of [
    ['Susu UHT Full Cream', 'Sisa 2 Liter • Batas Min 5L'],
    ['Gula Aren Cair Premium', 'Sisa 1.5 Botol • Batas Min 4'],
    ['Mie Telur Kering', 'Sisa 6 Porsi • Batas Min 15'],
  ]) {
    const ingRow = b.frame(`StockItem/${ingName}`, 334, 42, {
      fill: V('bg-surface'),
      cornerRadius: 10,
      layout: 'horizontal',
      padding: [6, 10, 6, 10],
      mainAlign: 'spaceBetween',
      crossAlign: 'center',
      sizingH: 'fill',
      sizingV: 'hug',
    }, stockInline);
    const ingCopy = b.frame('IngText', 210, 30, {
      fill: 'none',
      layout: 'vertical',
      gap: 1,
      sizingH: 'fill',
      sizingV: 'hug',
    }, ingRow);
    b.text(ingCopy, ingName, { size: 12, weight: 'SemiBold', color: V('ink-primary'), lineHeight: '120%' });
    b.text(ingCopy, rem, { size: 10, color: V('status-danger'), lineHeight: '120%' });
    b.pillButton(ingRow, '+ Restok', { bg: V('brand-tint'), fg: V('brand-primary'), height: 28, radius: 8, fillH: false, size: 10 });
  }

  buildMobileBottomNav(b, s4, 'dashboard');

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN 5: Desktop - Kasir Workspace Left Rail (1440x900)
  // ═══════════════════════════════════════════════════════════════════════
  const s5 = b.frame('Desktop - Kasir Workspace (1440x900)', 1440, 900, {
    x: 0,
    y: 920,
    fill: V('bg-main'),
    layout: 'horizontal',
    clip: true,
    devStatus: 'readyForDev',
  });

  // Left Rail Sidebar (explicitly positioned on the LEFT on desktop!)
  const leftRail = b.frame('DesktopLeftRail', 248, 900, {
    fill: V('bg-surface'),
    stroke: V('border-subtle'),
    strokeWeight: 1,
    strokeSides: [false, true, false, false],
    layout: 'vertical',
    padding: 16,
    gap: 10,
    sizingH: 'fixed',
    sizingV: 'fill',
  }, s5);

  const railLogo = b.frame('RailBrand', 216, 48, {
    fill: 'none',
    layout: 'horizontal',
    gap: 10,
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, leftRail);
  const railBadge = b.frame('BadgeMark', 36, 36, {
    fill: V('brand-primary'),
    cornerRadius: 10,
    layout: 'vertical',
    mainAlign: 'center',
    crossAlign: 'center',
    sizingH: 'fixed',
    sizingV: 'fixed',
  }, railLogo);
  b.text(railBadge, 'K', { size: 17, weight: 'Bold', color: '#ffffff', fillH: false });
  const railBrandTxt = b.frame('BrandCopy', 160, 36, { fill: 'none', layout: 'vertical', gap: 1, sizingH: 'fill', sizingV: 'hug' }, railLogo);
  b.text(railBrandTxt, 'KostKu POS', { size: 15, weight: 'Bold', color: V('ink-primary'), lineHeight: '120%' });
  b.text(railBrandTxt, 'Owner #999 • Lokal Cepat', { size: 11, color: V('ink-muted'), lineHeight: '120%' });

  b.pillButton(leftRail, '+ Tambah Menu Baru', { bg: V('brand-primary'), fg: '#ffffff', height: 40, radius: 12, size: 13 });

  const railItems = [
    ['Kasir Walk-in', true],
    ['Dashboard & Opening', false],
    ['Dapur (KDS)', false],
    ['Meja & QR Self-Order', false],
    ['Gudang & Stok Menipis (4)', false],
    ['Promo & Loyalty', false],
    ['Statistik Keuangan', false],
    ['Karyawan & Shift', false],
  ];
  for (const [label, isActive] of railItems) {
    const navBtn = b.frame(`RailNav/${label}`, 216, 40, {
      fill: isActive ? V('brand-tint') : 'none',
      cornerRadius: 10,
      layout: 'horizontal',
      padding: [0, 12, 0, 12],
      gap: 10,
      crossAlign: 'center',
      sizingH: 'fill',
      sizingV: 'fixed',
    }, leftRail);
    b.rect('NavDot', 16, 16, { fill: isActive ? V('brand-primary') : V('bg-slate-200'), cornerRadius: 5 }, navBtn);
    b.text(navBtn, label, {
      size: 13,
      weight: isActive ? 'Bold' : 'Medium',
      color: isActive ? V('brand-primary') : V('ink-secondary'),
    });
  }

  // Center Catalog Area (Flex Fill)
  const centerPane = b.frame('DesktopCatalogPane', 812, 900, {
    fill: 'none',
    layout: 'vertical',
    padding: 20,
    gap: 16,
    sizingH: 'fill',
    sizingV: 'fill',
  }, s5);

  const deskHeader = b.frame('CatalogTopBar', 772, 48, {
    fill: 'none',
    layout: 'horizontal',
    gap: 12,
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, centerPane);
  const deskTitle = b.frame('HdrCopy', 380, 44, { fill: 'none', layout: 'vertical', gap: 2, sizingH: 'fill', sizingV: 'hug' }, deskHeader);
  b.text(deskTitle, 'Katalog Menu Kasir', { size: 20, weight: 'Bold', color: V('ink-primary'), lineHeight: '120%' });
  b.text(deskTitle, 'Terhubung lokal ke Akun #999 + Staf (Kategori terisolasi)', { size: 12, color: V('ink-muted'), lineHeight: '120%' });
  b.pillButton(deskHeader, 'Mode Lokal Aktif (0ms Delay)', { bg: V('status-success-tint'), fg: V('status-success'), height: 34, radius: 9999, fillH: false, size: 12 });

  const deskCats = b.frame('DesktopCategories', 772, 34, {
    fill: 'none',
    layout: 'horizontal',
    gap: 8,
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, centerPane);
  b.pillButton(deskCats, 'Semua Menu (6)', { bg: V('brand-primary'), fg: '#ffffff', height: 32, radius: 9999, fillH: false, size: 12 });
  b.pillButton(deskCats, 'Makanan (3)', { bg: V('bg-surface'), fg: V('ink-secondary'), stroke: V('border-subtle'), height: 32, radius: 9999, fillH: false, size: 12 });
  b.pillButton(deskCats, 'Minuman (1)', { bg: V('bg-surface'), fg: V('ink-secondary'), stroke: V('border-subtle'), height: 32, radius: 9999, fillH: false, size: 12 });
  b.pillButton(deskCats, 'Snack (1)', { bg: V('bg-surface'), fg: V('ink-secondary'), stroke: V('border-subtle'), height: 32, radius: 9999, fillH: false, size: 12 });
  b.pillButton(deskCats, 'Spesial Toko A • Privat (1)', { bg: V('brand-tint'), fg: V('brand-primary'), stroke: V('brand-primary'), height: 32, radius: 9999, fillH: false, size: 12 });

  // Two balanced 3-card rows
  const dRow1 = b.frame('DesktopGridRow1', 772, 196, { fill: 'none', layout: 'horizontal', gap: 14, sizingH: 'fill', sizingV: 'hug' }, centerPane);
  buildProductCard(b, dRow1, { name: 'Es Kopi Aren Spesial', category: 'Spesial Toko A', price: 'Rp 28.000', imgBg: '#fef3c7', inStock: '99', selectedQty: 1 });
  buildProductCard(b, dRow1, { name: 'Mie Gacoan Level 2', category: 'Makanan', price: 'Rp 13.000', imgBg: '#dbeafe', inStock: '99', selectedQty: 0 });
  buildProductCard(b, dRow1, { name: 'Nasi Goreng Telur', category: 'Makanan', price: 'Rp 18.000', imgBg: '#e0e7ff', inStock: '99', selectedQty: 1 });

  const dRow2 = b.frame('DesktopGridRow2', 772, 196, { fill: 'none', layout: 'horizontal', gap: 14, sizingH: 'fill', sizingV: 'hug' }, centerPane);
  buildProductCard(b, dRow2, { name: 'Ayam Geprek Sambal', category: 'Makanan', price: 'Rp 17.000', imgBg: '#fee2e2', inStock: '99', selectedQty: 0 });
  buildProductCard(b, dRow2, { name: 'Dimsum Siomay (4pcs)', category: 'Snack', price: 'Rp 15.000', imgBg: '#f3e8ff', inStock: '99', selectedQty: 0 });
  buildProductCard(b, dRow2, { name: 'Es Teh Manis Jumbo', category: 'Minuman', price: 'Rp 5.000', imgBg: '#dcfce7', inStock: '99', selectedQty: 0 });

  // Right Pinned Cart Panel
  const rightCart = b.frame('DesktopPinnedCart', 380, 900, {
    fill: V('bg-surface'),
    stroke: V('border-subtle'),
    strokeWeight: 1,
    strokeSides: [true, false, false, false],
    layout: 'vertical',
    padding: 20,
    gap: 14,
    sizingH: 'fixed',
    sizingV: 'fill',
  }, s5);

  const rcHdr = b.frame('CartHeader', 340, 40, {
    fill: 'none',
    layout: 'horizontal',
    mainAlign: 'spaceBetween',
    crossAlign: 'center',
    sizingH: 'fill',
    sizingV: 'hug',
  }, rightCart);
  b.text(rcHdr, 'Keranjang Order #042', { size: 16, weight: 'Bold', color: V('ink-primary'), fillH: false });
  b.badge(rcHdr, 'Walk-in / Meja', { bg: V('brand-tint'), fg: V('brand-primary'), size: 10 });

  for (const [itemName, qty, total] of [
    ['Es Kopi Aren Spesial', '1 x Rp 28.000', 'Rp 28.000'],
    ['Nasi Goreng Telur', '1 x Rp 18.000', 'Rp 18.000'],
  ]) {
    const line = b.frame(`CartLine/${itemName}`, 340, 62, {
      fill: V('bg-subtle'),
      stroke: V('border-subtle'),
      strokeWeight: 1,
      cornerRadius: 12,
      layout: 'horizontal',
      padding: [10, 12, 10, 12],
      mainAlign: 'spaceBetween',
      crossAlign: 'center',
      sizingH: 'fill',
      sizingV: 'hug',
    }, rightCart);
    const lc = b.frame('LineCopy', 210, 38, { fill: 'none', layout: 'vertical', gap: 2, sizingH: 'fill', sizingV: 'hug' }, line);
    b.text(lc, itemName, { size: 13, weight: 'SemiBold', color: V('ink-primary'), lineHeight: '125%' });
    b.text(lc, qty, { size: 11, color: V('ink-muted'), lineHeight: '120%' });
    b.text(line, total, { size: 13, weight: 'Bold', color: V('ink-primary'), fillH: false });
  }

  const totalBox = b.frame('CheckoutTotals', 340, 110, {
    fill: V('bg-main'),
    cornerRadius: 14,
    layout: 'vertical',
    padding: 14,
    gap: 8,
    sizingH: 'fill',
    sizingV: 'hug',
  }, rightCart);
  const subRow = b.frame('SubtotalRow', 312, 20, { fill: 'none', layout: 'horizontal', mainAlign: 'spaceBetween', sizingH: 'fill', sizingV: 'hug' }, totalBox);
  b.text(subRow, 'Subtotal (2 item)', { size: 12, color: V('ink-secondary'), fillH: false });
  b.text(subRow, 'Rp 46.000', { size: 12, weight: 'SemiBold', color: V('ink-primary'), fillH: false });
  const grandRow = b.frame('GrandTotalRow', 312, 26, { fill: 'none', layout: 'horizontal', mainAlign: 'spaceBetween', sizingH: 'fill', sizingV: 'hug' }, totalBox);
  b.text(grandRow, 'Total Bayar', { size: 14, weight: 'Bold', color: V('ink-primary'), fillH: false });
  b.text(grandRow, 'Rp 46.000', { size: 18, weight: 'Bold', color: V('brand-primary'), fillH: false });

  b.pillButton(rightCart, 'Proses Pembayaran (Tunai / QRIS)', { bg: V('brand-primary'), fg: '#ffffff', height: 46, radius: 12, size: 13 });

  return { b, mainMobileRef: s1 };
}

function main() {
  const { b, mainMobileRef } = buildKasirScreens();
  b.push('inspect.code', { id: mainMobileRef, language: 'tailwind' });

  fs.writeFileSync(SCRIPT_JSON, JSON.stringify(b.commands, null, 2), 'utf8');
  try {
    const stdout = execFileSync(
      'figcraft-cli',
      ['--no-system-fonts', 'run', SCRIPT_JSON, '--out', OUT_FILE],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    const lines = stdout.trim().split('\n').filter((l) => l.startsWith('{'));
    let failed = 0;
    let tailwindCode = '';
    for (const line of lines) {
      const obj = JSON.parse(line);
      if (!obj.ok) {
        failed += 1;
        console.error('STEP FAILED:', line);
      } else if (obj.command === 'inspect.code' && obj.result?.code) {
        tailwindCode = obj.result.code;
      }
    }
    if (failed > 0) {
      throw new Error(`${failed} FigCraft steps failed`);
    }
    const tailwindOutPath = path.join(DESIGN_DIR, 'kasir_mobile_tailwind.preview.tsx');
    if (tailwindCode) fs.writeFileSync(tailwindOutPath, tailwindCode, 'utf8');
    console.log(`Generated ${OUT_FILE} cleanly (${lines.length} steps OK, 0 failures).`);
  } finally {
    if (fs.existsSync(SCRIPT_JSON)) fs.unlinkSync(SCRIPT_JSON);
  }
}

main();
