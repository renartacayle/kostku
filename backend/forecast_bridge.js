/**
 * Node.js Bridge & Instant Cache Engine for KostKu Demand & Sales Forecasting.
 *
 * Bridges live db.pos_orders, db.pos_products, db.pos_recipes & db.pos_inventory
 * into Python Forecasting Microservice (LightGBM Quantile + Tiered Routing + WMAPE Safety Fallback),
 * computes live inventory portion headroom & raw ingredient restock lists,
 * and caches results for <5ms reads in Web POS.
 */

const path = require('path');
const { spawn } = require('child_process');

const PYTHON_RUNNER_PATH = path.join(__dirname, '..', 'forecasting_service', 'batch_runner.py');

const CITY_UMK_MACRO_MAP = {
  semarang: {
    city: 'Semarang',
    umk_monthly_idr: 3454827,
    umk_tier: 'TIER_B_MADYA',
    food_inflation_yoy_pct: 3.1,
    policy_rate_pct: 6.0,
    commodity_index: 101.4,
    retail_index_30d_return_pct: 3.6
  },
  jakarta: {
    city: 'Jakarta',
    umk_monthly_idr: 5396761,
    umk_tier: 'TIER_A_METRO',
    food_inflation_yoy_pct: 3.3,
    policy_rate_pct: 6.0,
    commodity_index: 102.0,
    retail_index_30d_return_pct: 4.2
  },
  surabaya: {
    city: 'Surabaya',
    umk_monthly_idr: 4961753,
    umk_tier: 'TIER_A_METRO',
    food_inflation_yoy_pct: 3.2,
    policy_rate_pct: 6.0,
    commodity_index: 101.8,
    retail_index_30d_return_pct: 3.8
  },
  bandung: {
    city: 'Bandung',
    umk_monthly_idr: 4482914,
    umk_tier: 'TIER_A_METRO',
    food_inflation_yoy_pct: 3.1,
    policy_rate_pct: 6.0,
    commodity_index: 101.5,
    retail_index_30d_return_pct: 3.1
  },
  yogyakarta: {
    city: 'Yogyakarta',
    umk_monthly_idr: 2655041,
    umk_tier: 'TIER_C_DAERAH',
    food_inflation_yoy_pct: 2.9,
    policy_rate_pct: 6.0,
    commodity_index: 100.8,
    retail_index_30d_return_pct: 2.9
  },
  solo: {
    city: 'Solo',
    umk_monthly_idr: 2416560,
    umk_tier: 'TIER_C_DAERAH',
    food_inflation_yoy_pct: 2.9,
    policy_rate_pct: 6.0,
    commodity_index: 100.6,
    retail_index_30d_return_pct: 2.5
  }
};

function toWibDateStr(dateInput = new Date()) {
  const ms = new Date(dateInput).getTime();
  const safeMs = Number.isFinite(ms) ? ms : Date.now();
  return new Date(safeMs + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function getMacroForCity(rawCity) {
  const clean = String(rawCity || 'Semarang').trim();
  const key = clean.toLowerCase();
  for (const [k, val] of Object.entries(CITY_UMK_MACRO_MAP)) {
    if (key.includes(k)) {
      return {
        ...val,
        city: clean,
        umk_idr: val.umk_monthly_idr,
        food_inflation_yoy: val.food_inflation_yoy_pct,
        retail_index_30d_trend: val.retail_index_30d_return_pct
      };
    }
  }
  return {
    city: clean || 'Semarang',
    umk_monthly_idr: 3240000,
    umk_idr: 3240000,
    umk_tier: 'TIER_B_MADYA',
    food_inflation_yoy_pct: 3.1,
    food_inflation_yoy: 3.1,
    policy_rate_pct: 6.0,
    commodity_index: 101.2,
    retail_index_30d_return_pct: 3.0,
    retail_index_30d_trend: 3.0
  };
}

/**
 * Computes sellable SKU stock portions from recipe ingredients in db.pos_inventory
 * or falls back cleanly to product.stock.
 */
function resolveProductSellableStock(db, product) {
  const recipes = (db.pos_recipes && db.pos_recipes[product.id]) || [];
  if (!Array.isArray(recipes) || recipes.length === 0) {
    return Math.max(0, Number(product.stock ?? 0));
  }

  let minPortions = Infinity;
  let matchedAny = false;
  recipes.forEach(ing => {
    const inv = (db.pos_inventory || []).find(i => String(i.id) === String(ing.inventoryId));
    const reqAmt = Number(ing.amount) || 0;
    if (inv && reqAmt > 0) {
      matchedAny = true;
      const avail = Math.max(0, Number(inv.currentStock) || 0);
      minPortions = Math.min(minPortions, Math.floor(avail / reqAmt));
    }
  });

  if (!matchedAny || !Number.isFinite(minPortions)) {
    return Math.max(0, Number(product.stock ?? 0));
  }
  return Math.max(0, minPortions);
}

function buildIngredientRestockRecommendations(db, storeProducts, skuForecasts) {
  const shortfallByInv = {};
  const productById = new Map((storeProducts || []).map(p => [String(p.id), p]));

  skuForecasts.forEach(row => {
    const prod = productById.get(String(row.product_id));
    if (!prod) return;
    const shortfallP50 = Math.ceil(Number(row.restock_shortfall_p50) || 0);
    const shortfallP90 = Math.ceil(Number(row.restock_shortfall_p90) || 0);
    if (shortfallP50 <= 0 && shortfallP90 <= 0) return;

    const recipes = (db.pos_recipes && db.pos_recipes[prod.id]) || [];
    recipes.forEach(ing => {
      const inv = (db.pos_inventory || []).find(i => String(i.id) === String(ing.inventoryId));
      const amtPerUnit = Number(ing.amount) || 0;
      if (!inv || amtPerUnit <= 0) return;

      if (!shortfallByInv[inv.id]) {
        shortfallByInv[inv.id] = {
          inventory_id: inv.id,
          inventory_name: inv.name,
          unit: inv.unit,
          current_stock: Number(inv.currentStock) || 0,
          min_alert_stock: Number(inv.minAlertStock) || 0,
          cost_per_unit: Number(inv.costPerUnit) || 0,
          required_extra_p50: 0,
          required_extra_p90: 0,
          estimated_restock_cost_p50_idr: 0,
          impacted_menus: []
        };
      }
      const extraP50 = shortfallP50 * amtPerUnit;
      const extraP90 = shortfallP90 * amtPerUnit;
      shortfallByInv[inv.id].required_extra_p50 += extraP50;
      shortfallByInv[inv.id].required_extra_p90 += extraP90;
      shortfallByInv[inv.id].estimated_restock_cost_p50_idr += Math.round(extraP50 * (Number(inv.costPerUnit) || 0));
      if (!shortfallByInv[inv.id].impacted_menus.includes(prod.name)) {
        shortfallByInv[inv.id].impacted_menus.push(prod.name);
      }
    });
  });

  return Object.values(shortfallByInv).sort(
    (a, b) => b.estimated_restock_cost_p50_idr - a.estimated_restock_cost_p50_idr
  );
}

/**
 * Builds daily_sku_sales, external_calendar_weather, and regional_umk_macro payload
 * directly from KostKu DB collections + optional simulated/override series.
 */
function buildBatchInputFromDb(db, ownerStores = [], options = {}) {
  const runDateStr = options.runDate || toWibDateStr(new Date());
  const storesList = Array.isArray(options.stores_override) && options.stores_override.length > 0
    ? options.stores_override.map(s => ({ ...s, id: s.id || s.store_id, name: s.name || s.store_name }))
    : Array.isArray(ownerStores) && ownerStores.length > 0
      ? ownerStores
      : [{ id: db.settings?.posStore?.merchantId || 'PTR-PRIMARY', name: db.settings?.posStore?.storeName || 'Toko Utama', city: 'Semarang' }];

  const primaryStoreId = String(storesList[0]?.id || '');
  const storesMeta = storesList.map(s => {
    const macro = getMacroForCity(s.city || 'Semarang');
    return {
      store_id: String(s.id),
      store_name: s.name || s.storeName || s.store_name || 'Toko POS',
      city: macro.city,
      umk_tier: s.umk_tier || macro.umk_tier,
      umk_monthly_idr: s.umk_monthly_idr || macro.umk_monthly_idr
    };
  });

  const storeCityById = new Map(storesMeta.map(s => [s.store_id, s.city]));
  const productsMeta = Array.isArray(options.products_override) && options.products_override.length > 0
    ? options.products_override.map(p => ({
        store_id: String(p.store_id),
        product_id: String(p.product_id),
        product_name: p.product_name || String(p.product_id),
        category_name: p.category_name || p.category || 'Makanan',
        price_idr: Number(p.price_idr ?? p.price) || 15000,
        current_stock_qty: Number(p.current_stock_qty ?? p.current_stock) || 0
      }))
    : [];

  if (productsMeta.length === 0) {
    storesMeta.forEach(sMeta => {
      const isPrimary = sMeta.store_id === primaryStoreId;
      const storeProds = (db.pos_products || []).filter(p => {
        if (!p) return false;
        if (p.storeId) return String(p.storeId) === sMeta.store_id;
        return isPrimary;
      });
      storeProds.forEach(p => {
        productsMeta.push({
          store_id: sMeta.store_id,
          product_id: String(p.id),
          product_name: p.name,
          category_name: p.category || 'Makanan',
          price_idr: Number(p.price) || 15000,
          current_stock_qty: resolveProductSellableStock(db, p)
        });
      });
    });
  }

  const prodCatById = new Map((db.pos_products || []).map(p => [String(p.id), p.category || 'Makanan']));
  const prodPriceById = new Map((db.pos_products || []).map(p => [String(p.id), Number(p.price) || 15000]));

  // Build daily_sku_sales from real non-cancelled pos_orders over last 180 days
  let dailySkuSales = [];
  if (Array.isArray(options.daily_sku_sales_override) && options.daily_sku_sales_override.length > 0) {
    dailySkuSales = options.daily_sku_sales_override;
  } else {
    const aggMap = {};
    const stockoutKeys = new Set(
      (db.daily_sku_stockouts || []).map(x => `${x.store_id}|${x.product_id}|${x.sale_date}`)
    );

    (db.pos_orders || []).forEach(ord => {
      if (!ord || ord.status === 'CANCELLED') return;
      const sid = String(ord.storeId || primaryStoreId);
      if (!storeCityById.has(sid)) return;
      const saleDate = toWibDateStr(ord.createdAt || ord.paidAt || new Date());
      const city = storeCityById.get(sid) || 'Semarang';
      const hasDiscount = Number(ord.discount || ord.promoDiscount || ord.pointDiscountIdr || 0) > 0 ? 1 : 0;

      (ord.items || []).forEach(it => {
        const pid = String(it.productId || it.id || '');
        if (!pid) return;
        const key = `${sid}|${pid}|${saleDate}`;
        const qty = Math.max(0, Number(it.qty) || 1);
        const gross = Number(it.subtotal) || qty * (Number(it.price) || prodPriceById.get(pid) || 15000);
        if (!aggMap[key]) {
          aggMap[key] = {
            store_id: sid,
            product_id: pid,
            category_name: prodCatById.get(pid) || 'Makanan',
            city,
            sale_date: saleDate,
            qty_sold: 0,
            gross_sales_idr: 0,
            effective_price_idr: prodPriceById.get(pid) || 15000,
            discount_flag: hasDiscount,
            is_stockout: stockoutKeys.has(key) ? 1 : 0,
            closing_stock_qty: 0
          };
        }
        aggMap[key].qty_sold += qty;
        aggMap[key].gross_sales_idr += gross;
        if (hasDiscount) aggMap[key].discount_flag = 1;
        if (aggMap[key].qty_sold > 0) {
          aggMap[key].effective_price_idr = Math.round(aggMap[key].gross_sales_idr / aggMap[key].qty_sold);
        }
      });
    });

    dailySkuSales = Object.values(aggMap);
  }

  // Calendar + weather grid for past 180d & next 30d per unique city
  const cities = Array.from(new Set(storesMeta.map(s => s.city)));
  const externalCalendarWeather = Array.isArray(options.external_calendar_weather) && options.external_calendar_weather.length > 0
    ? options.external_calendar_weather
    : [];

  if (externalCalendarWeather.length === 0) {
    const baseMs = new Date(`${runDateStr}T00:00:00Z`).getTime();
    cities.forEach(city => {
      for (let offset = -180; offset <= 30; offset++) {
        const d = new Date(baseMs + offset * 86400000);
        const iso = d.toISOString().slice(0, 10);
        const jsDow = d.getUTCDay(); // 0=Sun..6=Sat
        const pyDow = jsDow === 0 ? 6 : jsDow - 1; // 0=Mon..6=Sun
        const dom = d.getUTCDate();
        const isWeekend = pyDow >= 5 ? 1 : 0;
        const isPayday = dom >= 25 || dom <= 5 ? 1 : 0;
        externalCalendarWeather.push({
          city,
          target_date: iso,
          day_of_week: pyDow,
          is_weekend: isWeekend,
          is_payday_window: isPayday,
          is_holiday: 0,
          days_to_next_holiday: Math.max(0, 14 - (dom % 14)),
          is_ramadan: 0,
          rain_mm: offset % 5 === 0 ? 8.5 : 0.0,
          temp_c: offset % 5 === 0 ? 27.5 : 30.2
        });
      }
    });
  }

  const customMacro = Array.isArray(options.macro_override) && options.macro_override.length > 0
    ? options.macro_override
    : Array.isArray(options.regional_umk_macro) && options.regional_umk_macro.length > 0
      ? options.regional_umk_macro
      : [];
  const regionalUmkMacro = customMacro.map(m => ({
    ...m,
    umk_monthly_idr: Number(m.umk_monthly_idr ?? m.umk_idr) || 3240000,
    umk_idr: Number(m.umk_idr ?? m.umk_monthly_idr) || 3240000,
    food_inflation_yoy_pct: Number(m.food_inflation_yoy_pct ?? m.food_inflation_yoy) || 3.1,
    food_inflation_yoy: Number(m.food_inflation_yoy ?? m.food_inflation_yoy_pct) || 3.1,
    policy_rate_pct: Number(m.policy_rate_pct ?? m.bi_rate_pct) || 6.0,
    commodity_index: Number(m.commodity_index ?? m.staple_commodity_index) || 101.5,
    retail_index_30d_return_pct: Number(m.retail_index_30d_return_pct ?? m.retail_index_30d_trend) || 0,
    retail_index_30d_trend: Number(m.retail_index_30d_trend ?? m.retail_index_30d_return_pct) || 0
  }));

  if (regionalUmkMacro.length === 0) {
    const currentMonthPrefix = runDateStr.slice(0, 7);
    const months = [];
    const baseDate = new Date(`${currentMonthPrefix}-01T00:00:00Z`);
    for (let m = -6; m <= 1; m++) {
      const md = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + m, 1));
      months.push(md.toISOString().slice(0, 10));
    }
    cities.forEach(city => {
      const mac = getMacroForCity(city);
      months.forEach(pm => {
        regionalUmkMacro.push({
          ...mac,
          period_month: pm
        });
      });
    });
  }

  return {
    run_date: runDateStr,
    stores: storesMeta,
    products: productsMeta,
    daily_sku_sales: dailySkuSales,
    external_calendar_weather: externalCalendarWeather,
    regional_umk_macro: regionalUmkMacro
  };
}

function invokePythonBatchRunner(payload) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [PYTHON_RUNNER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    proc.on('error', err => reject(err));
    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`Python forecasting exited with ${code}: ${stderr || stdout}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Invalid JSON from forecasting runner: ${e.message}`));
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

let inMemoryForecastCache = null;

async function runAndCacheForecastBatch(db, ownerStores, options = {}, persistToDb = false, writeDB = null, req = null) {
  const payload = buildBatchInputFromDb(db, ownerStores, options);
  const pyRes = await invokePythonBatchRunner(payload);

  const bundle = {
    success: true,
    engine: pyRes.engine,
    run_date: pyRes.run_date,
    batch_schedule_wib: pyRes.batch_schedule_wib || '01:00–03:00 WIB',
    generated_at: new Date().toISOString(),
    store_diagnostics: pyRes.store_diagnostics || [],
    forecasts: pyRes.forecasts || [],
    regional_context: (() => {
      const matched = payload.regional_umk_macro
        .filter(m => String(m.period_month).startsWith(String(pyRes.run_date).slice(0, 7)));
      return matched.length > 0 ? matched : payload.regional_umk_macro;
    })()
  };

  if (persistToDb || (!options?.stores_override && !options?.daily_sku_sales_override)) {
    inMemoryForecastCache = bundle;
  }
  if (persistToDb) {
    db.sales_forecasts = bundle.forecasts;
    db.forecast_batch_meta = {
      engine: bundle.engine,
      run_date: bundle.run_date,
      batch_schedule_wib: bundle.batch_schedule_wib,
      generated_at: bundle.generated_at,
      store_diagnostics: bundle.store_diagnostics,
      regional_context: bundle.regional_context
    };
    if (typeof writeDB === 'function') {
      writeDB(db, req);
    }
  }

  return bundle;
}

function getCachedForecastBundle(db) {
  if (Array.isArray(db?.sales_forecasts) && db.sales_forecasts.length > 0 && db.forecast_batch_meta) {
    return {
      success: true,
      ...db.forecast_batch_meta,
      forecasts: db.sales_forecasts
    };
  }
  return inMemoryForecastCache;
}

function formatStoreForecastApiResponse(db, bundle, storeId, horizonCode = 'H1_TOMORROW') {
  const cleanSid = String(storeId || '');
  const cleanHorizon = ['H1_TOMORROW', 'H7_NEXT_WEEK', 'H30_NEXT_MONTH'].includes(horizonCode)
    ? horizonCode
    : 'H1_TOMORROW';

  const items = (bundle?.forecasts || [])
    .filter(r => (!cleanSid || String(r.store_id) === cleanSid) && r.horizon_code === cleanHorizon)
    .sort((a, b) => (b.restock_shortfall_p50 - a.restock_shortfall_p50) || (b.p50_qty - a.p50_qty));

  const diag = (bundle?.store_diagnostics || []).find(d => String(d.store_id) === cleanSid) || bundle?.store_diagnostics?.[0] || null;
  const macroCtx = (bundle?.regional_context || []).find(m => String(m.city).toLowerCase() === String(diag?.city || 'Semarang').toLowerCase())
    || bundle?.regional_context?.[0]
    || getMacroForCity(diag?.city || 'Semarang');

  const storeProds = (db.pos_products || []).filter(p => p && (!p.storeId || String(p.storeId) === cleanSid));
  const restockMaterials = buildIngredientRestockRecommendations(db, storeProds, items);

  return {
    success: true,
    engine: bundle?.engine || 'LightGBM Quantile + Tiered Routing (Python)',
    run_date: bundle?.run_date || toWibDateStr(new Date()),
    generated_at: bundle?.generated_at || new Date().toISOString(),
    batch_schedule_wib: bundle?.batch_schedule_wib || '01:00–03:00 WIB',
    store_id: cleanSid || diag?.store_id || null,
    horizon_code: cleanHorizon,
    diagnostic: diag,
    macro_context: macroCtx,
    summary: {
      total_skus: items.length,
      total_predicted_p10: Math.round(items.reduce((s, r) => s + Number(r.p10_qty || 0), 0)),
      total_predicted_p50: Math.round(items.reduce((s, r) => s + Number(r.p50_qty || 0), 0)),
      total_predicted_p90: Math.round(items.reduce((s, r) => s + Number(r.p90_qty || 0), 0)),
      total_projected_revenue_p50_idr: items.reduce((s, r) => s + Number(r.projected_revenue_p50_idr || 0), 0),
      skus_need_restock_p50: items.filter(r => r.restock_shortfall_p50 > 0).length,
      skus_need_restock_p90: items.filter(r => r.restock_shortfall_p90 > 0).length,
      total_restock_cost_p50_idr: restockMaterials.reduce((s, m) => s + Number(m.estimated_restock_cost_p50_idr || 0), 0)
    },
    items,
    restock_materials: restockMaterials
  };
}

module.exports = {
  buildBatchInputFromDb,
  runAndCacheForecastBatch,
  getCachedForecastBundle,
  formatStoreForecastApiResponse,
  resolveProductSellableStock,
  toWibDateStr
};
