import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('students').select('academic_year');
  const counts = {};
  data.forEach(s => {
    counts[s.academic_year] = (counts[s.academic_year] || 0) + 1;
  });
  console.log('Student counts by academic_year:', counts);
}
run();
