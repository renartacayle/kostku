// Supabase Direct Cloud Database Service
const STORAGE_SUPABASE_URL = 'kostku_supabase_url';
const STORAGE_SUPABASE_KEY = 'kostku_supabase_anon_key';

export const getSupabaseConfig = () => {
  return {
    url: localStorage.getItem(STORAGE_SUPABASE_URL) || '',
    key: localStorage.getItem(STORAGE_SUPABASE_KEY) || '',
    isConfigured: Boolean(localStorage.getItem(STORAGE_SUPABASE_URL) && localStorage.getItem(STORAGE_SUPABASE_KEY))
  };
};

export const setSupabaseConfig = (url, key) => {
  if (url && key) {
    localStorage.setItem(STORAGE_SUPABASE_URL, url.trim().replace(/\/+$/, ''));
    localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_SUPABASE_URL);
    localStorage.removeItem(STORAGE_SUPABASE_KEY);
  }
  window.dispatchEvent(new Event('kostku_connection_changed'));
};

export const testSupabaseConnection = async (testUrl = null, testKey = null) => {
  const cfg = getSupabaseConfig();
  const url = testUrl || cfg.url;
  const key = testKey || cfg.key;

  if (!url || !key) {
    return { ok: false, error: 'URL atau API Key Supabase belum diisi' };
  }

  const startTime = performance.now();
  try {
    const res = await fetch(`${url}/rest/v1/kosts?select=count`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Range': '0-0'
      }
    });

    const latency = Math.round(performance.now() - startTime);
    if (res.ok || res.status === 206) {
      return { ok: true, latency, error: null };
    } else {
      const err = await res.json().catch(() => ({}));
      let msg = err.message || err.error_description || err.error || `HTTP ${res.status}`;
      if (res.status === 404 || msg.toLowerCase().includes('project')) {
        msg = 'Project Supabase tidak ditemukan. Periksa kembali URL Project Supabase Anda (format: https://[project-id].supabase.co).';
      }
      return { ok: false, latency, error: msg };
    }
  } catch (err) {
    let msg = err.message || 'Gagal tersambung ke Supabase';
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
      msg = 'Gagal menghubungi server Supabase. Pastikan URL project sudah benar dan koneksi internet aktif.';
    }
    return { ok: false, latency: 0, error: msg };
  }
};
