import { createClient } from '@supabase/supabase-js';

// Mengambil konfigurasi dari Environment Variables (Vite)
// Menggunakan fallback object {} jika import.meta.env tidak tersedia (misal: environment belum siap)
const env = (import.meta as any).env || {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL atau Anon Key belum diset. Aplikasi mungkin tidak berjalan dengan benar. Pastikan file .env ada (local) atau Environment Variables diset (Netlify).');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);