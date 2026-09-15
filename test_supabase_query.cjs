const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xyz.supabase.co', 'dummy');
const q = supabase.from('test').select('*')
  .gte('created_at', '2025-01-01')
  .lte('created_at', '2025-12-31')
  .gte('created_at', '2026-09-15');
console.log(q.url.toString());
