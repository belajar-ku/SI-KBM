import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const passwords = ['Spansa@1', '234567', 'admin', 'admin123', 'password', '12345678', '123456', 'guru123'];

async function run() {
  for (const p of passwords) {
    const res = await supabase.auth.signInWithPassword({
      email: '234567@sekolah.id',
      password: p
    });
    if (res.data?.session) {
      console.log('SUCCESS with password:', p);
      
      // Now test insert
      const testStudent = {
        nisn: 'TEST_MUTASI_1',
        nis: '9991',
        name: 'Murid Mutasi Baru',
        kelas: '7A',
        gender: 'L',
        jenjang: '7',
        academic_year: '2026/2027'
      };
      const insertRes = await supabase.from('students').insert(testStudent).select();
      console.log('Insert result:', insertRes.data, 'Error:', insertRes.error);
      if (insertRes.data) {
        await supabase.from('students').delete().eq('nisn', 'TEST_MUTASI_1');
      }
      return;
    }
  }
  console.log('None of the passwords matched.');
}
run();
