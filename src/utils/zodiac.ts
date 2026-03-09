const LUNAR_MONTH = 29.530588853;
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime() / 86400000;
import { parseFlexibleDate, flexibleDateToDate } from './dateUtils';

function getMoonAgeDays(date: Date): number {
    const daysSince = (date.getTime() / 86400000) - KNOWN_NEW_MOON;
    let phase = daysSince % LUNAR_MONTH;
    if (phase < 0) phase += LUNAR_MONTH;
    return phase;
}

export function getLunarNewYearDate(year: number): Date {
    // Le Nouvel An Chinois correspond à la nouvelle lune la plus proche du 4 Février (Lichun)
    let closestToFeb4 = new Date(Date.UTC(year, 0, 21)); // Fallback
    let minDiff = 100;

    // On scanne la période possible du Nouvel An (20 Janvier au 22 Février)
    for (let d = 20; d <= 53; d++) {
        // On évalue à midi UTC pour éviter les effets de bord liés au fuseau
        const date = new Date(Date.UTC(year, 0, d, 12, 0, 0));
        const age = getMoonAgeDays(date);

        // Si on est un jour de nouvelle lune (l'âge est proche de 0 ou 29.5)
        if (age < 1.0 || age > 28.5) {
            const feb4 = new Date(Date.UTC(year, 1, 4, 12, 0, 0));
            const diffDays = Math.abs((date.getTime() - feb4.getTime()) / 86400000);
            if (diffDays < minDiff) {
                minDiff = diffDays;
                // On fixe la date au début du jour UTC
                closestToFeb4 = new Date(Date.UTC(year, 0, d, 0, 0, 0));
            }
        }
    }

    return closestToFeb4;
}

export interface ZodiacInfo {
    name: string;
    emoji: string;
}

export function getWesternZodiac(dateStr: string | Date): ZodiacInfo | null {
    if (!dateStr) return null;

    let d: Date | null;
    if (dateStr instanceof Date) {
        d = dateStr;
    } else {
        d = flexibleDateToDate(parseFlexibleDate(dateStr));
    }

    if (!d || isNaN(d.getTime())) return null;

    const day = d.getDate();
    const month = d.getMonth() + 1; // 1-12

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: 'Bélier', emoji: '♈' };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: 'Taureau', emoji: '♉' };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: 'Gémeaux', emoji: '♊' };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: 'Cancer', emoji: '♋' };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: 'Lion', emoji: '♌' };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: 'Vierge', emoji: '♍' };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: 'Balance', emoji: '♎' };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: 'Scorpion', emoji: '♏' };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: 'Sagittaire', emoji: '♐' };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: 'Capricorne', emoji: '♑' };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: 'Verseau', emoji: '♒' };
    return { name: 'Poissons', emoji: '♓' };
}

const CHINESE_ANIMALS = [
    { name: 'Rat', emoji: '🐀' },
    { name: 'Buffle', emoji: '🐂' },
    { name: 'Tigre', emoji: '🐅' },
    { name: 'Lapin', emoji: '🐇' },
    { name: 'Dragon', emoji: '🐉' },
    { name: 'Serpent', emoji: '🐍' },
    { name: 'Cheval', emoji: '🐎' },
    { name: 'Chèvre', emoji: '🐐' },
    { name: 'Singe', emoji: '🐒' },
    { name: 'Coq', emoji: '🐓' },
    { name: 'Chien', emoji: '🐕' },
    { name: 'Cochon', emoji: '🐖' }
];

const CHINESE_ELEMENTS = [
    { name: 'Métal', color: 'text-stone-300' }, // 0, 1
    { name: 'Eau', color: 'text-blue-400' },    // 2, 3
    { name: 'Bois', color: 'text-emerald-500' }, // 4, 5
    { name: 'Feu', color: 'text-orange-500' },  // 6, 7
    { name: 'Terre', color: 'text-amber-700' }  // 8, 9
];

export interface ChineseZodiacInfo {
    animal: string;
    element: string;
    emoji: string;
    fullName: string;
    elementColor: string;
}

export function getChineseZodiac(dateStr: string | Date): ChineseZodiacInfo | null {
    if (!dateStr) return null;

    let localDate: Date | null;
    if (dateStr instanceof Date) {
        localDate = dateStr;
    } else {
        localDate = flexibleDateToDate(parseFlexibleDate(dateStr));
    }

    if (!localDate || isNaN(localDate.getTime())) return null;

    // Create UTC date representation
    const d = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 12, 0, 0));

    const year = d.getUTCFullYear();
    const lny = getLunarNewYearDate(year);

    // Déterminer l'année chinoise
    let chineseYear = year;
    if (d.getTime() < lny.getTime()) {
        chineseYear = year - 1;
    }

    // Le cycle de 60 ans est basé sur 1924 (Année du Rat de Bois)
    // 1924 - 4 = 1920. 1920 % 12 = 0 (Rat)
    let animalIdx = (chineseYear - 4) % 12;
    if (animalIdx < 0) animalIdx += 12;

    const animal = CHINESE_ANIMALS[animalIdx];

    // L'élément dépend du dernier chiffre de l'année chinoise
    // 0,1 -> Metal (0) | 2,3 -> Water (1) | 4,5 -> Wood (2) | 6,7 -> Fire (3) | 8,9 -> Earth (4)
    const elementIdx = Math.floor((Math.abs(chineseYear) % 10) / 2);
    const element = CHINESE_ELEMENTS[elementIdx];

    return {
        animal: animal.name,
        element: element.name,
        emoji: animal.emoji,
        fullName: `${animal.name} de ${element.name}`,
        elementColor: element.color
    };
}
