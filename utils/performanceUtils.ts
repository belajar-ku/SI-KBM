import { supabase } from '../services/supabase';
import { Schedule } from '../types';

export interface NonEffectiveDay {
  date: string; // YYYY-MM-DD
  reason: string;
  hours: string; // "Full Day" or e.g. "1, 2"
}

export interface SchoolActivityItem {
  date: string;
  name: string;
}

export interface MonthEfficiencyStats {
  year: number;
  month: number;
  totalDays: number;
  endCalculationDay: number;
  sundayCount: number;
  nonEffectiveCount: number;
  effectiveDaysCount: number;
  nonEffectiveList: Array<{
    date: string;
    dayNum: number;
    dayName: string;
    reason: string;
    hours: string;
    type: 'holiday' | 'activity';
  }>;
}

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/**
 * Fetch non-effective days from app_settings and school_activities
 */
export async function fetchNonEffectiveData(): Promise<{
  nonEffectiveDays: NonEffectiveDay[];
  schoolActivities: SchoolActivityItem[];
}> {
  let nonEffectiveDays: NonEffectiveDay[] = [];
  let schoolActivities: SchoolActivityItem[] = [];

  try {
    const [settingsRes, activitiesRes] = await Promise.all([
      supabase.from('app_settings').select('value').eq('key', 'non_effective_days').single(),
      supabase.from('school_activities').select('date, name').order('date')
    ]);

    if (settingsRes.data?.value) {
      try {
        const parsed = JSON.parse(settingsRes.data.value);
        if (Array.isArray(parsed)) {
          nonEffectiveDays = parsed;
        }
      } catch (e) {
        console.error('Error parsing non_effective_days:', e);
      }
    }

    if (activitiesRes.data) {
      schoolActivities = activitiesRes.data;
    }
  } catch (err) {
    console.error('Error fetching non-effective data:', err);
  }

  return { nonEffectiveDays, schoolActivities };
}

/**
 * Calculate month calendar breakdown (effective vs non-effective days)
 */
export function getMonthEfficiencyStats(
  year: number,
  month: number, // 0 = Jan, 11 = Dec
  endDay?: number,
  nonEffectiveDays: NonEffectiveDay[] = [],
  schoolActivities: SchoolActivityItem[] = []
): MonthEfficiencyStats {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const endCalculationDay = endDay !== undefined ? Math.min(endDay, lastDayOfMonth) : lastDayOfMonth;

  let sundayCount = 0;
  let nonEffectiveCount = 0;
  let effectiveDaysCount = 0;
  const nonEffectiveList: MonthEfficiencyStats['nonEffectiveList'] = [];

  for (let d = 1; d <= endCalculationDay; d++) {
    const tempDate = new Date(year, month, d);
    const jsDay = tempDate.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (dbDay === 7) {
      sundayCount++;
      continue;
    }

    // Check non_effective_days
    const holiday = nonEffectiveDays.find(h => h.date === dateStr);
    // Check school_activities
    const activity = schoolActivities.find(a => a.date === dateStr);

    if (holiday) {
      const isFull = !holiday.hours || holiday.hours.toLowerCase().includes('full');
      nonEffectiveCount++;
      nonEffectiveList.push({
        date: dateStr,
        dayNum: d,
        dayName: DAY_NAMES[dbDay],
        reason: holiday.reason,
        hours: holiday.hours || 'Full Day',
        type: 'holiday'
      });
      if (!isFull) {
        effectiveDaysCount++;
      }
    } else if (activity) {
      nonEffectiveCount++;
      nonEffectiveList.push({
        date: dateStr,
        dayNum: d,
        dayName: DAY_NAMES[dbDay],
        reason: `Kegiatan: ${activity.name}`,
        hours: 'Full Day',
        type: 'activity'
      });
    } else {
      effectiveDaysCount++;
    }
  }

  return {
    year,
    month,
    totalDays: lastDayOfMonth,
    endCalculationDay,
    sundayCount,
    nonEffectiveCount,
    effectiveDaysCount,
    nonEffectiveList
  };
}

/**
 * Calculate Target JP for a teacher's schedule, strictly excluding non-effective days and school activities
 */
export function calculateTeacherTargetJp(
  schedules: Array<Pick<Schedule, 'day_of_week'> & Partial<Schedule>> | Array<{ day_of_week: any; [key: string]: any }>,
  year: number,
  month: number, // 0-11
  endDay: number,
  nonEffectiveDays: NonEffectiveDay[] = [],
  schoolActivities: SchoolActivityItem[] = []
): {
  targetJp: number;
  deductedJp: number;
  deductedBreakdown: Array<{ date: string; reason: string; deductedHours: number }>;
} {
  let targetJp = 0;
  let deductedJp = 0;
  const deductedBreakdown: Array<{ date: string; reason: string; deductedHours: number }> = [];

  for (let d = 1; d <= endDay; d++) {
    const tempDate = new Date(year, month, d);
    const jsDay = tempDate.getDay();
    const dbDay = jsDay === 0 ? 7 : jsDay;

    // Filter schedules for this day of week
    const daySchedules = schedules.filter(s => s.day_of_week === dbDay);
    if (daySchedules.length === 0) continue;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = nonEffectiveDays.find(h => h.date === dateStr);
    const activity = schoolActivities.find(a => a.date === dateStr);

    daySchedules.forEach(sched => {
      const schedHours = String(sched.hour || '')
        .split(',')
        .map((h: string) => h.trim())
        .filter(Boolean);
      const totalSchedHours = schedHours.length;

      if (holiday) {
        const isFull = !holiday.hours || holiday.hours.toLowerCase().includes('full');
        if (isFull) {
          // Full holiday: entire schedule is excluded
          deductedJp += totalSchedHours;
          deductedBreakdown.push({
            date: dateStr,
            reason: `${holiday.reason} (Full Day)`,
            deductedHours: totalSchedHours
          });
        } else {
          // Partial holiday: check specific hours
          const holidayHours = holiday.hours
            .split(',')
            .map((h: string) => h.trim().toLowerCase())
            .filter(Boolean);
          
          let effectiveForThisSched = 0;
          let excludedForThisSched = 0;

          schedHours.forEach((h: string) => {
            if (holidayHours.includes(h.toLowerCase())) {
              excludedForThisSched++;
            } else {
              effectiveForThisSched++;
            }
          });

          targetJp += effectiveForThisSched;
          if (excludedForThisSched > 0) {
            deductedJp += excludedForThisSched;
            deductedBreakdown.push({
              date: dateStr,
              reason: `${holiday.reason} (Sebagian jam: ${holiday.hours})`,
              deductedHours: excludedForThisSched
            });
          }
        }
      } else if (activity) {
        // Regular subject KBM does not run on school activities day
        deductedJp += totalSchedHours;
        deductedBreakdown.push({
          date: dateStr,
          reason: `Kegiatan Sekolah: ${activity.name}`,
          deductedHours: totalSchedHours
        });
      } else {
        // Normal effective teaching day
        targetJp += totalSchedHours;
      }
    });
  }

  return {
    targetJp,
    deductedJp,
    deductedBreakdown
  };
}
