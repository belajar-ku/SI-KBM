const fs = require('fs');
let code = fs.readFileSync('pages/AppsMenu.tsx', 'utf8');

code = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
` + code.replace(/import \{ useState, useEffect \} from 'react';\nimport \{ supabase \} from '\.\.\/services\/supabase';\nimport \{ getWIBDate, getWIBISOString \} from '\.\.\/utils\/dateUtils';\nimport \{   ChevronRight, BookOpenText, TrendingUp, UserCheck, ShieldAlert, ScanLine, Compass, Database, UserCog, CalendarRange, GraduationCap, Settings, UserMinus, Keyboard, Sun, BookOpen, Users, FileText, Star, Clock, Check\} from 'lucide-react';/, `import { supabase } from '../services/supabase';
import { getWIBDate, getWIBISOString } from '../utils/dateUtils';
import { ChevronRight, BookOpenText, TrendingUp, UserCheck, ShieldAlert, ScanLine, Compass, Database, UserCog, CalendarRange, GraduationCap, Settings, UserMinus, Keyboard, Sun, BookOpen, Users, FileText, Star, Clock, Check } from 'lucide-react';`);

fs.writeFileSync('pages/AppsMenu.tsx', code);
