
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  signIn: (userId: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  academicYear: string;
  semester: string;
  semesterStart: string;
  semesterEnd: string;
  activeScheduleVersion: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState<string>('2025/2026');
  const [semester, setSemester] = useState<string>('Genap');
  const [semesterStart, setSemesterStart] = useState<string>('');
  const [semesterEnd, setSemesterEnd] = useState<string>('');
  const [activeScheduleVersion, setActiveScheduleVersion] = useState<string>('Utama');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        if (!isSupabaseConfigured) return;
        const { data } = await supabase.from('app_settings').select('key, value').in('key', ['academic_year', 'semester', 'active_schedule_version']);
        if (data) {
           data.forEach(item => {
               if (item.key === 'academic_year' && item.value) setAcademicYear(item.value);
               if (item.key === 'semester' && item.value) setSemester(item.value);
               if (item.key === 'active_schedule_version' && item.value) setActiveScheduleVersion(item.value);
           });
        }
      } catch (e) {
          console.error("Error fetching settings for auth context", e);
      }
    };

    fetchSettings();

    const initAuth = async () => {
      // Prevent fetching if config is missing (avoids 404/Network Error loops)
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        // Check active session safely
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (session) {
          await fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Auth initialization failed (likely no connection):", error);
        // Do not block app loading on auth error
        setIsLoading(false);
      }
    };

    initAuth();

    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error fetching profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userId: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: "Konfigurasi Supabase belum diset. Hubungi Admin." } };
    }

    // LOGIKA USER ID:
    // Supabase membutuhkan email. Kita memanipulasi input User ID menjadi format email palsu.
    // Contoh: Input "234567" -> dikirim sebagai "234567@sekolah.id"
    
    // 1. Bersihkan input (hapus spasi)
    const cleanId = userId.trim();
    
    // 2. Jika user tidak sengaja memasukkan email lengkap, kita ambil depannya saja
    const idOnly = cleanId.split('@')[0];
    
    // 3. Gabungkan dengan domain internal aplikasi
    const email = `${idOnly}@sekolah.id`; 
    
    const result = await supabase.auth.signInWithPassword({ email, password });
    return result;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      profile, 
      isLoading, 
      signIn,
      signOut,
      isAdmin: profile?.role === 'admin',
      isOperator: profile?.role === 'operator',
      academicYear,
        semester,
        semesterStart,
        semesterEnd,
        activeScheduleVersion
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
