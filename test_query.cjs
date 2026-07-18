const { createClient } = require('@supabase/supabase-js');
const url = 'https://aobgqejpjomgwxiosgin.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYmdxZWpwam9tZ3d4aW9zZ2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDg0NTcsImV4cCI6MjA4NDMyNDQ1N30.E1jwkfMEexsUpflTIh2NSFGwpbFSwY78r313XNmVgko';
const supabase = createClient(url, key);
async function run() {
    const { data: d1, error: e1 } = await supabase.from('schedules').select('academic_year').limit(1);
    console.log("Error schedules.academic_year:", e1 ? e1.message : "Success");
    
    // We can also try to add the column if it's missing by calling rpc, but standard supabase doesn't have an rpc for arbitrary SQL unless one is created.
}
run();
