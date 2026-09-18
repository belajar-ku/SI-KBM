import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  await supabase.auth.signInWithPassword({ email: '234567@sekolah.id', password: 'admin' });
  
  // Try inserting with various fields
  // 1. Duplicate NISN in same academic year:
  const test1 = await supabase.from('students').insert({
    nisn: '0146053053', // Existing NISN
    name: 'Duplicate Test',
    kelas: '7A',
    academic_year: '2026/2027'
  }).select().single();
  console.log('Duplicate NISN error:', test1.error?.message, test1.error?.code);

  // 2. What if nisn is text vs number, or what if nis is empty string vs null:
  const test2 = await supabase.from('students').insert({
    nisn: '9988776655',
    nis: '',
    name: 'Empty NIS Test',
    kelas: '8A',
    gender: 'L',
    jenjang: '8',
    academic_year: '2026/2027'
  }).select().single();
  console.log('Empty NIS test:', test2.error?.message, test2.data ? 'Success' : 'Fail');
  if (test2.data) {
    await supabase.from('students').delete().eq('id', test2.data.id);
  }

  // 3. What if jenjang is '7' when kelas is '8A'?
  const test3 = await supabase.from('students').insert({
    nisn: '9988776654',
    name: 'Mismatch jenjang test',
    kelas: '8A',
    jenjang: '7',
    academic_year: '2026/2027'
  }).select().single();
  console.log('Mismatch jenjang test:', test3.error?.message, test3.data ? 'Success' : 'Fail');
  if (test3.data) {
    await supabase.from('students').delete().eq('id', test3.data.id);
  }
}
run();
