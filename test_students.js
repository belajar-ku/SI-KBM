import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: students, error: readError } = await supabase.from('students').select('*').limit(3);
  console.log('Read sample students:', students, 'Error:', readError);

  // Test insert with a dummy NISN
  const testPayload = {
    nisn: 'TEST999999',
    nis: '9999',
    name: 'Test Murid Mutasi',
    kelas: '7A',
    gender: 'L',
    jenjang: '7',
    academic_year: '2026/2027'
  };
  const { data: insertData, error: insertError } = await supabase.from('students').insert(testPayload).select();
  console.log('Insert result:', insertData, 'Error:', insertError);

  // Clean up if inserted
  if (insertData && insertData.length > 0) {
    await supabase.from('students').delete().eq('nisn', 'TEST999999');
    console.log('Cleaned up test murid');
  }
}
check();
