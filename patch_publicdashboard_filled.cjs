const fs = require('fs');
let code = fs.readFileSync('pages/PublicDashboard.tsx', 'utf8');

const oldStr1 = `        let completedJp = 0;
        if (journalsRes.data) {
            journalsRes.data.forEach((j: any) => {
                if (typeof j.hours === 'string') {
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }`;

const newStr1 = `        let completedJp = 0;
        const filledClassesSet = new Set<string>();
        if (journalsRes.data) {
            journalsRes.data.forEach((j: any) => {
                if (j.kelas) filledClassesSet.add(j.kelas);
                if (typeof j.hours === 'string') {
                    const parts = j.hours.split(',').filter((h: string) => h.trim().length > 0);
                    completedJp += parts.length;
                }
            });
        }
        
        if (homeroomRes.data) {
            homeroomRes.data.forEach((h: any) => {
                if (h.kelas) filledClassesSet.add(h.kelas);
            });
        }`;

code = code.replace(oldStr1, newStr1);

const oldStr2 = `        setStats({
            count7: c7, count8: c8, count9: c9,
            classDetails: classCounts, classGenderDetails: classGenderCounts,
            totalJpRequired: calculatedTotalJp, 
            completedJp: completedJp,
            absenceCount: sCount + iCount + aCount,
            absenceDetails: { S: sCount, I: iCount, A: aCount },
            absencePerClass: absencePerClass,
            unfilledKbm: []
        });`;

const newStr2 = `        setStats({
            count7: c7, count8: c8, count9: c9,
            classDetails: classCounts, classGenderDetails: classGenderCounts,
            totalJpRequired: calculatedTotalJp, 
            completedJp: completedJp,
            absenceCount: sCount + iCount + aCount,
            absenceDetails: { S: sCount, I: iCount, A: aCount },
            absencePerClass: absencePerClass,
            filledClasses: Array.from(filledClassesSet),
            unfilledKbm: []
        });`;

code = code.replace(oldStr2, newStr2);

fs.writeFileSync('pages/PublicDashboard.tsx', code);
console.log("Patched fetchStatsClientSide in PublicDashboard.tsx");
