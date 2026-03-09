
import { CharacterSheetData, AttributeEntry, DotEntry, CombatEntry, ReputationEntry } from '../types';

// --- RESET LOGIC ---
/**
 * Reset COMPLET d'une fiche (Table Rase totale).
 * Utilisé pour redémarrer un personnage de zéro.
 */
export const resetCharacterValues = (source: CharacterSheetData): CharacterSheetData => {
    const clean: CharacterSheetData = JSON.parse(JSON.stringify(source));

    // Reset Header
    Object.keys(clean.header).forEach((k) => {
        (clean.header as unknown as Record<string, string>)[k] = "";
    });

    // Reset XP & Logs
    clean.experience = { gain: '0', spent: '0', rest: '0' };
    clean.xpLogs = [];
    clean.appLogs = [];

    // Attributes
    if (clean.attributes) {
        Object.keys(clean.attributes).forEach((cat: string) => {
            if (Array.isArray(clean.attributes[cat])) {
                clean.attributes[cat].forEach((attr: AttributeEntry) => {
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
                clean.secondaryAttributes[cat].forEach((attr: AttributeEntry) => {
                    attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                    attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                });
            }
        });
    }

    // Skills
    Object.keys(clean.skills).forEach((cat: string) => {
        clean.skills[cat].forEach((skill: DotEntry) => {
            skill.value = 0;
            skill.creationValue = 0;
            if (typeof skill.current !== 'undefined') skill.current = 0;
        });
    });

    // Combat
    clean.combat.weapons.forEach((w: CombatEntry) => { w.weapon = ""; w.level = ""; w.init = ""; w.attack = ""; w.damage = ""; w.parry = ""; });
    clean.combat.armor.forEach((a: { type: string; protection: string; weight: string }) => { a.type = ""; a.protection = ""; a.weight = ""; });
    clean.combat.stats = { agility: '', dexterity: '', force: '', size: '' };

    // Page 2
    clean.page2.lieux_importants = "";
    clean.page2.contacts = "";
    clean.page2.reputation.forEach((r: ReputationEntry) => { r.reputation = ''; r.lieu = ''; r.valeur = ''; });
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
    if (clean.counters?.volonte) {
        const v = clean.counters.volonte as DotEntry;
        v.value = 3; v.creationValue = 3; v.current = 0;
    }
    if (clean.counters?.confiance) {
        const c = clean.counters.confiance as DotEntry;
        c.value = 3; c.creationValue = 3; c.current = 0;
    }
    if (clean.counters?.custom) {
        clean.counters.custom.forEach((c: DotEntry) => { c.value = 0; c.creationValue = 0; c.current = 0; });
    }

    return clean;
};

/**
 * Reset SURGICAL pour la Recréation (Respec).
 * Préserve l'identité, le social, l'équipement, les traits et l'image.
 * Réinitialise uniquement les statistiques (Attributs, Compétences) et prépare le remboursement d'XP.
 */
export const recreateCharacterStats = (source: CharacterSheetData): CharacterSheetData => {
    const clean: CharacterSheetData = JSON.parse(JSON.stringify(source));

    // ON GARDE : Header, Combat, Page2 (Social, Traits, Équipement, Image), CampaignNotes

    // Reset XP & Logs (Prêt pour le remboursement via RecreationService)
    clean.experience = { gain: '0', spent: '0', rest: '0' };
    clean.xpLogs = [];
    clean.appLogs = [];

    // Attributes (On vide les investissements et les valeurs de création)
    if (clean.attributes) {
        Object.keys(clean.attributes).forEach((cat: string) => {
            if (Array.isArray(clean.attributes[cat])) {
                clean.attributes[cat].forEach((attr: AttributeEntry) => {
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
                clean.secondaryAttributes[cat].forEach((attr: AttributeEntry) => {
                    attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                    attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                });
            }
        });
    }

    // Skills (On vide tout, les spécialités suivront)
    Object.keys(clean.skills).forEach((cat: string) => {
        clean.skills[cat].forEach((skill: DotEntry) => {
            skill.value = 0;
            skill.creationValue = 0;
            if (typeof skill.current !== 'undefined') skill.current = 0;
        });
    });

    // Specializations (Invalidées si on reset les compétences)
    clean.specializations = {};

    // Counters (Retour aux bases)
    if (clean.counters?.volonte) {
        const v = clean.counters.volonte as DotEntry;
        v.value = 3; v.creationValue = 3; v.current = 0;
    }
    if (clean.counters?.confiance) {
        const c = clean.counters.confiance as DotEntry;
        c.value = 3; c.creationValue = 3; c.current = 0;
    }
    if (clean.counters?.custom) {
        clean.counters.custom.forEach((c: DotEntry) => { c.value = 0; c.creationValue = 0; c.current = 0; });
    }

    return clean;
};
