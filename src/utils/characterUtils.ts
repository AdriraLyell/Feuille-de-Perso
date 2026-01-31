
import { CharacterSheetData } from '../types';

// --- RESET LOGIC ---
export const resetCharacterValues = (source: CharacterSheetData): CharacterSheetData => {
    const clean = JSON.parse(JSON.stringify(source));
    
    // Reset Header (keep structure)
    Object.keys(clean.header).forEach((k: keyof typeof clean.header) => clean.header[k] = "");
    
    // Reset XP
    clean.experience = { gain: '0', spent: '0', rest: '0' };
    clean.xpLogs = [];
    clean.appLogs = [];

    // Attributes
    if (clean.attributes) {
        Object.keys(clean.attributes).forEach((cat: string) => {
            if (Array.isArray(clean.attributes[cat])) {
                clean.attributes[cat].forEach((attr: any) => {
                    attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                    attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                });
            }
        });
    }
    
    // Secondary Attributes
    if (clean.secondaryAttributes) {
        Object.keys(clean.secondaryAttributes).forEach((cat: string) => {
            if (Array.isArray(clean.secondaryAttributes[cat])) {
                clean.secondaryAttributes[cat].forEach((attr: any) => {
                    attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                    attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                });
            }
        });
    }

    // Skills
    Object.keys(clean.skills).forEach((cat: string) => {
        clean.skills[cat].forEach((skill: any) => {
            skill.value = 0;
            skill.creationValue = 0;
            if (typeof skill.current !== 'undefined') skill.current = 0;
        });
    });

    // Combat
    clean.combat.weapons.forEach((w: any) => { w.weapon=""; w.level=""; w.init=""; w.attack=""; w.damage=""; w.parry=""; });
    clean.combat.armor.forEach((a: any) => { a.type=""; a.protection=""; a.weight=""; });
    clean.combat.stats = { agility: '', dexterity: '', force: '', size: '' };

    // Page 2
    clean.page2.lieux_importants = "";
    clean.page2.contacts = "";
    clean.page2.reputation.forEach((r: any) => { r.reputation = ''; r.lieu = ''; r.valeur = ''; });
    clean.page2.connaissances = "";
    clean.page2.valeurs_monetaires = "";
    clean.page2.armes_list = "";
    clean.page2.avantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
    clean.page2.desavantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
    clean.page2.equipement = "";
    clean.page2.notes = "";
    clean.page2.characterImage = "";
    clean.page2.characterImageId = undefined;

    // Specializations
    clean.specializations = {};
    
    // Campaign Notes
    clean.campaignNotes = [];
    
    // Counters
    clean.counters.volonte.value = 3; clean.counters.volonte.creationValue = 3; clean.counters.volonte.current = 0;
    clean.counters.confiance.value = 3; clean.counters.confiance.creationValue = 3; clean.counters.confiance.current = 0;
    clean.counters.custom.forEach((c: any) => { c.value = 0; c.creationValue = 0; c.current = 0; });

    return clean;
};
