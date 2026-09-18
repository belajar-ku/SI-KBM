import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://aobgqejpjomgwxiosgin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  // Let's check password_info of 234567 in profiles
  const { data: adminProfile } = await supabase.from('profiles').select('*').eq('nip', '234567').single();
  console.log('Admin profile:', adminProfile);
  
  if (adminProfile && adminProfile.password_info) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: '234567@sekolah.id',
      password: adminProfile.password_info
    });
    console.log('SignIn as Admin:', authData.user ? 'SUCCESS' : 'FAILED', authError);

    if (authData.user) {
      // Try to insert a test student as this admin
      const testStudent = {
        nisn: 'TEST_MUTASI_1',
        nis: '9991',
        name: 'Murid Mutasi Baru',
        kelas: '7A',
        gender: 'L',
        jenjang: '7',
        academic_year: '2026/2027'
      };
      const { data: insertRes, error: insertErr } = await supabase.from('students').insert(testStudent).select();
      console.log('Insert as authenticated Admin:', insertRes, 'Error:', insertErr);

      if (insertRes && insertRes.length > 0) {
        await supabase.from('students').delete().eq('nisn', 'TEST_MUTASI_1');
        console.log('Cleaned up');
      }
    }
  }
}
run();
