const fs = require('fs');
let code = fs.readFileSync('SUPABASE_SETUP.sql', 'utf8');

const tableSql = `
-- ==========================================
-- TABLE: school_activities
-- ==========================================
create table if not exists public.school_activities (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  name text not null,
  academic_year text not null default '2025/2026',
  semester text not null default 'Genap',
  created_at timestamptz default now()
);

alter table public.school_activities enable row level security;

drop policy if exists "Read school_activities" on public.school_activities;
create policy "Read school_activities" on public.school_activities for select to authenticated, anon using (true);

drop policy if exists "Admins manage school_activities" on public.school_activities;
create policy "Admins manage school_activities" on public.school_activities for all to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
`;

if (!code.includes('TABLE: school_activities')) {
    code += tableSql;
    fs.writeFileSync('SUPABASE_SETUP.sql', code);
    console.log("Added school_activities table to SUPABASE_SETUP.sql");
}
