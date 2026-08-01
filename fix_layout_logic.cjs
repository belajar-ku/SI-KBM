const fs = require('fs');
let code = fs.readFileSync('components/Layout.tsx', 'utf8');

// 1. Add pendingSplashCheck
if (!code.includes('const pendingSplashCheck = React.useRef(false);')) {
    code = code.replace(
        'const [showTeacherSplash, setShowTeacherSplash] = useState(false);',
        'const [showTeacherSplash, setShowTeacherSplash] = useState(false);\n  const pendingSplashCheck = React.useRef(false);\n\n  const openNotifModal = () => {\n      setShowNotifModal(true);\n      const notifCount = notifications.filter(n => !n.isFilled).length + waliNotifications.length;\n      const todayStr = new Date().toLocaleDateString(\'id-ID\');\n      localStorage.setItem(`lastSeenNotifCount_${profile?.id}_${todayStr}`, notifCount.toString());\n  };'
    );
}

// 2. Change justLoggedIn useEffect
const oldUseEffect = `  useEffect(() => {
     if (location.state?.justLoggedIn && profile?.role === 'user') {
        setShowTeacherSplash(true);
        const timer = setTimeout(() => {
            navigate(location.pathname, { replace: true, state: {} });
        }, 100);
        return () => clearTimeout(timer);
     }
  }, [location.state?.justLoggedIn, profile?.role, navigate, location.pathname]);`;

const newUseEffect = `  useEffect(() => {
     if (location.state?.justLoggedIn && profile?.role === 'user') {
        pendingSplashCheck.current = true;
        const timer = setTimeout(() => {
            navigate(location.pathname, { replace: true, state: {} });
        }, 100);
        return () => clearTimeout(timer);
     }
  }, [location.state?.justLoggedIn, profile?.role, navigate, location.pathname]);`;

code = code.replace(oldUseEffect, newUseEffect);

// 3. Add logic in fetchNotifs
const oldWaliPush = `                                absences.forEach((a: any) => {
                                    waliNotifs.push({`;

const notifLogic = `
                    const finalNotifCount = notifs.filter((n: any) => !n.isFilled).length + waliNotifs.length;
                    if (pendingSplashCheck.current) {
                        const todayStr = new Date().toLocaleDateString('id-ID');
                        const lsKey = \`lastSeenNotifCount_\${profile.id}_\${todayStr}\`;
                        const lastSeen = parseInt(localStorage.getItem(lsKey) || '0', 10);
                        if (finalNotifCount > 0 && finalNotifCount !== lastSeen) {
                            setShowTeacherSplash(true);
                        }
                        pendingSplashCheck.current = false;
                    }
                    setWaliNotifications(waliNotifs);`;

code = code.replace(/setWaliNotifications\(waliNotifs\);/g, notifLogic);

// 4. Replace setShowNotifModal(true) with openNotifModal
code = code.replace(/setShowNotifModal\(true\)/g, 'openNotifModal()');

fs.writeFileSync('components/Layout.tsx', code);
console.log("Layout logic updated");
