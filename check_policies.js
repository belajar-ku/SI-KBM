import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  // Let's test calling an rpc or querying pg_policies
  const { data, error } = await supabase.from('pg_policies').select('*');
  console.log('pg_policies:', data, error);
}
run();
