/**
 * KostKu User Preference & Mouse Interaction Tracking Engine
 * 
 * Capabilities:
 * 1. High-frequency, RAF-throttled Mouse Movement & Heatmap Tracking
 * 2. Hover Dwell-Time Engine (>700ms attention signals on Kos Cards, Filters, Banners)
 * 3. User Preference Profiler (Calculates Preferred Gender, Campus, Price Tier, and Top Viewed Units)
 * 4. Google Analytics 4 (gtag.js) & Google Tag Manager (dataLayer) event dispatching
 * 5. Google Chrome DevTools Console Suite (Interactive commands: window.kostkuPreferences(), window.kostkuHeatmap())
 * 6. LocalStorage persistence for multi-session preference personalization
 */

// Initialize dataLayer and safe gtag stub if not already declared
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
  }
}

// In-Memory Telemetry State
const state = {
  sessionStart: Date.now(),
  lastEventTime: Date.now(),
  mousePositions: [], // Sampled coordinates for heatmap { x, y, xPct, yPct, time }
  clicks: [], // Click heatmap points
  dwellEvents: {}, // targetId -> { count, totalMs, name, type, campus, price }
  currentHover: null, // { target, startTime, meta }
  scrollDepthMax: 0,
  preferences: {
    genderWeights: { Putra: 0, Putri: 0, Campur: 0 },
    campusWeights: {},
    priceWeights: { budget: 0, moderate: 0, premium: 0 },
    topKosts: [],
    preferredGender: 'Semua',
    preferredCampus: 'Belum terdeteksi',
    preferredPriceTier: 'Fleksibel',
    confidenceScore: 0.0
  }
};

// Throttle helper
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Update the dynamic preference profile based on accumulated interactions
 */
function recalculatePreferences() {
  const p = state.preferences;

  // 1. Calculate Gender Preference
  const genders = Object.keys(p.genderWeights);
  let bestGender = 'Semua';
  let maxGenderWeight = 0;
  let totalGenderWeight = 0;
  for (const g of genders) {
    const w = p.genderWeights[g];
    totalGenderWeight += w;
    if (w > maxGenderWeight) {
      maxGenderWeight = w;
      bestGender = g;
    }
  }
  p.preferredGender = maxGenderWeight >= 2 ? bestGender : 'Semua';

  // 2. Calculate Campus Preference
  const campuses = Object.keys(p.campusWeights);
  let bestCampus = 'Belum terdeteksi';
  let maxCampusWeight = 0;
  for (const c of campuses) {
    const w = p.campusWeights[c];
    if (w > maxCampusWeight) {
      maxCampusWeight = w;
      bestCampus = c;
    }
  }
  p.preferredCampus = maxCampusWeight >= 1 ? bestCampus : 'Belum terdeteksi';

  // 3. Calculate Price Tier Preference
  const { budget, moderate, premium } = p.priceWeights;
  if (budget > moderate && budget > premium) {
    p.preferredPriceTier = 'Hemat (< Rp 1.000.000/bln)';
  } else if (moderate >= budget && moderate >= premium && moderate > 0) {
    p.preferredPriceTier = 'Menengah (Rp 1.000.000 - Rp 1.800.000/bln)';
  } else if (premium > moderate && premium > budget) {
    p.preferredPriceTier = 'Eksklusif (> Rp 1.800.000/bln)';
  } else {
    p.preferredPriceTier = 'Fleksibel';
  }

  // 4. Calculate Top Kost by Engagement Score = (clicks * 3) + (dwellSeconds * 1.5)
  const kostRanking = Object.entries(state.dwellEvents)
    .filter(([_, meta]) => meta.type === 'kost-card')
    .map(([id, meta]) => {
      const dwellSec = Math.round((meta.totalMs || 0) / 100) / 10;
      const score = ((meta.clicks || 0) * 3) + (dwellSec * 1.5);
      return {
        id,
        name: meta.name || id,
        gender: meta.gender || '-',
        campus: meta.campus || '-',
        price: meta.price ? `Rp ${Number(meta.price).toLocaleString('id-ID')}` : '-',
        dwellSeconds: dwellSec,
        clicks: meta.clicks || 0,
        engagementScore: Math.round(score * 10) / 10
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore);

  p.topKosts = kostRanking.slice(0, 5);

  // Confidence score calculation (0.00 to 1.00)
  const totalSignals = totalGenderWeight + maxCampusWeight + (budget + moderate + premium) + state.clicks.length;
  p.confidenceScore = Math.min(1.0, Math.round((totalSignals / 12) * 100) / 100);

  // Persist to localStorage
  try {
    localStorage.setItem('kostku_user_preference_profile', JSON.stringify({
      preferredGender: p.preferredGender,
      preferredCampus: p.preferredCampus,
      preferredPriceTier: p.preferredPriceTier,
      confidenceScore: p.confidenceScore,
      topKosts: p.topKosts,
      lastUpdated: new Date().toISOString()
    }));
  } catch (_) {}

  // Dispatch to Google Analytics & DataLayer
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'user_preference_signal', {
      event_category: 'User Behavior',
      event_label: `Gender:${p.preferredGender} | Campus:${p.preferredCampus}`,
      preferred_gender: p.preferredGender,
      preferred_campus: p.preferredCampus,
      preferred_price_tier: p.preferredPriceTier,
      confidence_score: p.confidenceScore,
      top_kos: p.topKosts[0]?.name || 'None'
    });
  }

  // Dispatch custom DOM event
  window.dispatchEvent(new CustomEvent('kostku_preference_updated', {
    detail: { ...p, sessionDurationSec: Math.round((Date.now() - state.sessionStart) / 1000) }
  }));
}

/**
 * Handle mouse clicks & tap heatmap
 */
function handlePointerClick(e) {
  const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  const winW = window.innerWidth || 1;
  const winH = window.innerHeight || 1;
  const xPct = Math.round((x / winW) * 1000) / 10;
  const yPct = Math.round((y / winH) * 1000) / 10;

  const target = e.target;
  const trackEl = target.closest('[data-track]');
  const trackType = trackEl ? trackEl.getAttribute('data-track') : target.tagName.toLowerCase();
  const trackId = trackEl ? (trackEl.getAttribute('data-kost-id') || trackEl.getAttribute('data-id') || trackType) : target.tagName;

  const clickData = {
    x,
    y,
    xPct,
    yPct,
    trackType,
    trackId,
    targetTag: target.tagName,
    textSnippet: (target.innerText || '').slice(0, 30).trim(),
    time: Date.now() - state.sessionStart
  };

  state.clicks.push(clickData);
  if (state.clicks.length > 100) state.clicks.shift(); // keep last 100 clicks

  // If clicked a Kost Card, add high-weight signal
  if (trackEl && trackType === 'kost-card') {
    const id = trackEl.getAttribute('data-kost-id') || 'unknown';
    const name = trackEl.getAttribute('data-kost-name') || 'Kost Item';
    const gender = trackEl.getAttribute('data-kost-type');
    const campus = trackEl.getAttribute('data-kost-campus');
    const price = Number(trackEl.getAttribute('data-kost-price')) || 0;

    if (!state.dwellEvents[id]) {
      state.dwellEvents[id] = { count: 0, totalMs: 0, clicks: 0, name, type: 'kost-card', gender, campus, price };
    }
    state.dwellEvents[id].clicks = (state.dwellEvents[id].clicks || 0) + 1;

    // Weight preferences
    if (gender && state.preferences.genderWeights[gender] !== undefined) {
      state.preferences.genderWeights[gender] += 3;
    }
    if (campus) {
      state.preferences.campusWeights[campus] = (state.preferences.campusWeights[campus] || 0) + 3;
    }
    if (price > 0) {
      if (price < 1000000) state.preferences.priceWeights.budget += 3;
      else if (price <= 1800000) state.preferences.priceWeights.moderate += 3;
      else state.preferences.priceWeights.premium += 3;
    }

    recalculatePreferences();
  }

  // Google Analytics event
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'mouse_heatmap_click', {
      event_category: 'Heatmap',
      x_pct: xPct,
      y_pct: yPct,
      target_type: trackType,
      target_id: trackId
    });
  }

  // Developer / Google Console Log
  if (trackType === 'kost-card') {
    console.info(
      `%c[KostKu GA Telemetry]%c 🖱️ Clicked Kos Card: %c${clickData.textSnippet || trackId}%c at (${xPct}%, ${yPct}%)`,
      'background: #2563eb; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;',
      'color: #94a3b8;',
      'color: #38bdf8; font-weight: 700;',
      'color: #94a3b8;'
    );
  }
}

/**
 * Handle hover dwell tracking
 */
function handlePointerOver(e) {
  const trackEl = e.target.closest('[data-track]');
  if (!trackEl) return;

  const trackType = trackEl.getAttribute('data-track');
  const trackId = trackEl.getAttribute('data-kost-id') || trackEl.getAttribute('data-id') || trackType;
  const name = trackEl.getAttribute('data-kost-name') || trackType;
  const gender = trackEl.getAttribute('data-kost-type');
  const campus = trackEl.getAttribute('data-kost-campus');
  const price = Number(trackEl.getAttribute('data-kost-price')) || 0;

  state.currentHover = {
    element: trackEl,
    id: trackId,
    name,
    type: trackType,
    gender,
    campus,
    price,
    startTime: Date.now()
  };
}

function handlePointerOut(e) {
  if (!state.currentHover) return;

  const now = Date.now();
  const dwellMs = now - state.currentHover.startTime;
  const { id, name, type, gender, campus, price } = state.currentHover;

  // Only record if dwelled for >= 700ms (clear indicator of human reading/intent)
  if (dwellMs >= 700) {
    if (!state.dwellEvents[id]) {
      state.dwellEvents[id] = { count: 0, totalMs: 0, clicks: 0, name, type, gender, campus, price };
    }
    state.dwellEvents[id].count += 1;
    state.dwellEvents[id].totalMs += dwellMs;

    // If kos card, add preference weight
    if (type === 'kost-card') {
      const dwellSeconds = Math.round(dwellMs / 100) / 10;
      const weightBonus = dwellSeconds >= 3 ? 2 : 1;

      if (gender && state.preferences.genderWeights[gender] !== undefined) {
        state.preferences.genderWeights[gender] += weightBonus;
      }
      if (campus) {
        state.preferences.campusWeights[campus] = (state.preferences.campusWeights[campus] || 0) + weightBonus;
      }
      if (price > 0) {
        if (price < 1000000) state.preferences.priceWeights.budget += weightBonus;
        else if (price <= 1800000) state.preferences.priceWeights.moderate += weightBonus;
        else state.preferences.priceWeights.premium += weightBonus;
      }

      recalculatePreferences();

      // Emit to Google Analytics
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'kos_card_dwell', {
          event_category: 'Attention Heatmap',
          kos_id: id,
          kos_name: name,
          dwell_seconds: dwellSeconds
        });
      }

      console.info(
        `%c[KostKu GA Telemetry]%c ⏱️ Hover Dwell: %c${name}%c for ${dwellSeconds}s (Preference Signal Added)`,
        'background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;',
        'color: #94a3b8;',
        'color: #34d399; font-weight: 700;',
        'color: #94a3b8;'
      );
    }
  }

  state.currentHover = null;
}

/**
 * Handle mouse movement coordinates sampling
 */
const handleMouseMoveThrottled = throttle((e) => {
  const winW = window.innerWidth || 1;
  const winH = window.innerHeight || 1;
  const x = e.clientX;
  const y = e.clientY;
  const xPct = Math.round((x / winW) * 1000) / 10;
  const yPct = Math.round((y / winH) * 1000) / 10;

  state.mousePositions.push({
    x,
    y,
    xPct,
    yPct,
    time: Date.now() - state.sessionStart
  });

  // Limit position memory to 200 points
  if (state.mousePositions.length > 200) {
    state.mousePositions.shift();
  }
}, 100);

/**
 * Handle Scroll Depth Tracking
 */
const handleScrollThrottled = throttle(() => {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  if (docH <= 0) return;
  const currentScroll = window.scrollY || document.documentElement.scrollTop;
  const pct = Math.min(100, Math.round((currentScroll / docH) * 100));

  if (pct > state.scrollDepthMax) {
    state.scrollDepthMax = pct;

    // Google Analytics milestones
    const milestones = [25, 50, 75, 90, 100];
    for (const m of milestones) {
      if (pct >= m && !state[`milestone_${m}`]) {
        state[`milestone_${m}`] = true;
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'scroll_depth', {
            event_category: 'User Engagement',
            depth_percent: m
          });
        }
      }
    }
  }
}, 250);

/**
 * Explicit helper to register custom user action (e.g. from filter modals or search bars)
 */
export function trackUserAction(actionType, data = {}) {
  if (typeof window === 'undefined') return;

  if (actionType === 'filter_gender' && data.gender) {
    if (state.preferences.genderWeights[data.gender] !== undefined) {
      state.preferences.genderWeights[data.gender] += 4;
    }
    recalculatePreferences();
  } else if (actionType === 'filter_campus' && data.campus) {
    state.preferences.campusWeights[data.campus] = (state.preferences.campusWeights[data.campus] || 0) + 4;
    recalculatePreferences();
  } else if (actionType === 'search_query' && data.query) {
    const q = data.query.toLowerCase();
    if (q.includes('putri') || q.includes('cewek')) state.preferences.genderWeights.Putri += 4;
    if (q.includes('putra') || q.includes('cowok')) state.preferences.genderWeights.Putra += 4;
    if (q.includes('campur') || q.includes('pasutri')) state.preferences.genderWeights.Campur += 4;

    const knownCampuses = ['udinus', 'undip', 'unnes', 'unissula', 'usm', 'upgris'];
    for (const kc of knownCampuses) {
      if (q.includes(kc)) {
        const caps = kc.toUpperCase();
        state.preferences.campusWeights[caps] = (state.preferences.campusWeights[caps] || 0) + 4;
      }
    }
    recalculatePreferences();
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', actionType, {
      event_category: 'User Preference Signal',
      ...data
    });
  }
}

/**
 * Initialize Mouse Tracking & User Preference Engine
 */
export function initUserTracker() {
  if (typeof window === 'undefined' || window.__KOSTKU_TRACKER_INITIALIZED__) {
    return;
  }
  window.__KOSTKU_TRACKER_INITIALIZED__ = true;

  // Attach global DOM listeners
  window.addEventListener('mousemove', handleMouseMoveThrottled, { passive: true });
  window.addEventListener('click', handlePointerClick, { capture: true, passive: true });
  window.addEventListener('mouseover', handlePointerOver, { passive: true });
  window.addEventListener('mouseout', handlePointerOut, { passive: true });
  window.addEventListener('scroll', handleScrollThrottled, { passive: true });

  // Touch fallback for mobile
  window.addEventListener('touchstart', (e) => {
    handlePointerClick(e);
    handlePointerOver(e);
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    handlePointerOut(e);
  }, { passive: true });

  // Register Google Chrome DevTools Console Commands
  window.kostkuPreferences = function() {
    recalculatePreferences();
    const p = state.preferences;
    const duration = Math.round((Date.now() - state.sessionStart) / 1000);

    console.group(
      `%c📊 KOSTKU USER PREFERENCE REPORT (Google Console Diagnostics)`,
      'background: #1e293b; color: #38bdf8; font-size: 14px; font-weight: 800; padding: 6px 12px; border-radius: 6px; border: 1px solid #38bdf8;'
    );

    console.log('%c🎯 RINGKASAN PREFERENSI PENGUNJUNG:', 'font-weight: 800; color: #f8fafc;');
    console.table([
      { 'Indikator': 'Tipe Gender Favorit', 'Nilai': p.preferredGender, 'Keterangan': `Skor Minat: ${JSON.stringify(p.genderWeights)}` },
      { 'Indikator': 'Kampus / Area Favorit', 'Nilai': p.preferredCampus, 'Keterangan': `Skor Minat Kampus: ${JSON.stringify(p.campusWeights)}` },
      { 'Indikator': 'Rentang Harga Disukai', 'Nilai': p.preferredPriceTier, 'Keterangan': `Budget: ${p.priceWeights.budget}, Menengah: ${p.priceWeights.moderate}, Mewah: ${p.priceWeights.premium}` },
      { 'Indikator': 'Confidence Score', 'Nilai': `${Math.round(p.confidenceScore * 100)}%`, 'Keterangan': 'Tingkat keyakinan algoritma preferensi' },
      { 'Indikator': 'Total Interaksi Klik', 'Nilai': state.clicks.length, 'Keterangan': 'Titik klik terekam di heatmap' },
      { 'Indikator': 'Scroll Depth Maksimal', 'Nilai': `${state.scrollDepthMax}%`, 'Keterangan': 'Kedalaman eksplorasi halaman' },
      { 'Indikator': 'Durasi Sesi', 'Nilai': `${duration} detik`, 'Keterangan': 'Waktu aktif pengunjung' }
    ]);

    if (p.topKosts.length > 0) {
      console.log('%c🏡 TOP 5 KOST PALING DIMINATI (Berdasarkan Dwell-Time & Clicks):', 'font-weight: 800; color: #34d399;');
      console.table(p.topKosts);
    } else {
      console.log('%cℹ️ Belum ada kost yang di-hover lebih dari 700ms. Arahkan kursor ke kartu kost untuk merekam minat.', 'color: #94a3b8;');
    }

    console.log('%c💡 Tips Google Console: Ketik window.kostkuHeatmap() untuk melihat koordinat titik klik heatmap.', 'color: #94a3b8; font-style: italic;');
    console.groupEnd();

    return state.preferences;
  };

  window.kostkuHeatmap = function() {
    console.group('%c🔥 KOSTKU MOUSE CLICK & ATTENTION HEATMAP', 'background: #b91c1c; color: white; padding: 4px 8px; border-radius: 4px;');
    console.table(state.clicks.map((c, i) => ({
      '#': i + 1,
      'Target': c.trackType,
      'ID / Snippet': c.trackId || c.textSnippet,
      'Posisi X': `${c.xPct}%`,
      'Posisi Y': `${c.yPct}%`,
      'Waktu (ms)': c.time
    })));
    console.groupEnd();
    return state.clicks;
  };

  window.kostkuExportTelemetry = function() {
    recalculatePreferences();
    return {
      sessionStartTime: new Date(state.sessionStart).toISOString(),
      sessionDurationSeconds: Math.round((Date.now() - state.sessionStart) / 1000),
      preferences: state.preferences,
      scrollDepthMax: state.scrollDepthMax,
      clickCount: state.clicks.length,
      clicks: state.clicks,
      dwellSummary: state.dwellEvents
    };
  };

  // Expose global tracker state
  window.kostkuTelemetry = state;
  window.trackKostInteraction = (action, kost) => {
    trackUserAction(`kost_${action}`, {
      id: kost.uid || kost.id,
      name: kost.kostName,
      gender: kost.type,
      campus: kost.city,
      price: kost.price || (kost.rooms && kost.rooms[0] ? kost.rooms[0].price : 0)
    });
  };

  // Startup announcement in Google Chrome Console
  console.log(
    `%c[KostKu GA Telemetry & Mouse Tracking Engine Active]%c\nKetik %cwindow.kostkuPreferences()%c di Google Console untuk memantau preferensi pengunjung secara real-time.`,
    'background: #2563eb; color: #ffffff; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 4px;',
    'color: #94a3b8;',
    'color: #38bdf8; font-weight: bold;',
    'color: #94a3b8;'
  );
}

// Auto-run if running in browser
if (typeof window !== 'undefined') {
  initUserTracker();
}
