const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('students').select('id, kelas, gender, academic_year').limit(5);
    console.log("Error:", error);
    console.log("Data:", data);
}
check();
