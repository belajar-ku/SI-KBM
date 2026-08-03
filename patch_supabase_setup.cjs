const fs = require('fs');
let sql = fs.readFileSync('SUPABASE_SETUP.sql', 'utf8');

const migrationScript = `

-- UPDATE ANY NULL ACADEMIC_YEAR DATA TO 2025/2026
DO $$
BEGIN
  UPDATE public.students SET academic_year = '2025/2026' WHERE academic_year IS NULL;
  UPDATE public.schedules SET academic_year = '2025/2026' WHERE academic_year IS NULL;
  UPDATE public.journals SET academic_year = '2025/2026' WHERE academic_year IS NULL;
  UPDATE public.homeroom_attendance SET academic_year = '2025/2026' WHERE academic_year IS NULL;
  UPDATE public.journal_notes SET academic_year = '2025/2026' WHERE academic_year IS NULL;
  UPDATE public.attendance_logs SET academic_year = '2025/2026' WHERE academic_year IS NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if tables don't exist yet
END $$;

`;

if (!sql.includes('UPDATE ANY NULL ACADEMIC_YEAR')) {
    sql = sql + migrationScript;
    fs.writeFileSync('SUPABASE_SETUP.sql', sql);
    console.log("Added data migration to SUPABASE_SETUP.sql");
}
