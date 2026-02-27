
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const paths = {
    rules: path.join(rootDir, 'public', 'data', 'rules.json'),
    traits: path.join(rootDir, 'public', 'data', 'traits.json')
};

const generateId = () => Math.random().toString(36).substring(2, 10);

function migrateLibrary(rules) {
    const stats = {
        traitsProcessed: 0,
        effectsMigrated: 0,
        formulasCreated: 0
    };

    const traits = rules.libraries?.traits || rules.data || [];
    const formulas = [...(rules.libraries?.formulas || [])];

    const newTraits = traits.map(trait => {
        if (!trait.effects || trait.effects.length === 0) return trait;

        stats.traitsProcessed++;
        const newEffects = trait.effects.map(effect => {
            if (effect.type === 'formula' && effect.formulaId) return effect;

            let formulaName = '';
            let formulaString = '';
            let effectType = '';
            let target = effect.target || '';
            let operator = 'ADD';

            if (effect.type === 'free_skill_rank') {
                formulaName = `Rang : ${effect.target}`;
                formulaString = `${effect.value}`;
                effectType = 'free_skill_rank';
            } else if (effect.type === 'xp_bonus') {
                formulaName = `Bonus XP : ${trait.name}`;
                formulaString = `${effect.value}`;
                target = 'XP';
                effectType = 'xp_bonus';
            } else if (effect.type === 'master_skill') {
                formulaName = `Maîtrise : ${effect.target || trait.name}`;
                formulaString = `5`;
                effectType = 'master_skill';
                operator = 'SET';
            } else if (effect.type === 'attribute_bonus') {
                formulaName = `Bonus : ${effect.target}`;
                formulaString = `${effect.value}`;
                effectType = 'attribute_bonus';
            } else if (effect.type === 'formula' && effect.formula && !effect.formulaId) {
                formulaName = `Mécanique : ${trait.name}`;
                formulaString = effect.formula;
                effectType = 'formula';
                target = effect.target || '';
            }

            if (formulaName) {
                if (formulaString.startsWith('-')) {
                    operator = 'SUB';
                    formulaString = formulaString.substring(1);
                }

                const existing = formulas.find(f => f.name === formulaName && f.formula === formulaString);
                let targetFormulaId = '';

                if (existing) {
                    targetFormulaId = existing.id;
                } else {
                    const newFormula = {
                        id: `migrated_${generateId()}`,
                        name: formulaName,
                        formula: formulaString,
                        type: 'modifier',
                        target: target,
                        effectType: effectType,
                        description: `Migré depuis le trait: ${trait.name}`,
                        isActive: true,
                        isGlobal: true,
                        operator: operator
                    };
                    formulas.push(newFormula);
                    targetFormulaId = newFormula.id;
                    stats.formulasCreated++;
                }

                stats.effectsMigrated++;
                return {
                    ...effect,
                    type: 'formula',
                    formulaId: targetFormulaId,
                    value: 0
                };
            }

            return effect;
        });

        return { ...trait, effects: newEffects };
    });

    if (rules.libraries) {
        rules.libraries.traits = newTraits;
        rules.libraries.formulas = formulas;
    } else {
        rules.data = newTraits;
        rules.formulas = formulas; // If it's the standalone traits.json, we might need to handle formulas elsewhere or inject them back
    }

    return stats;
}

console.log('🚀 Démarrage de la migration des traits...');

// 1. Migration de rules.json
if (fs.existsSync(paths.rules)) {
    const rules = JSON.parse(fs.readFileSync(paths.rules, 'utf8'));
    const stats = migrateLibrary(rules);
    fs.writeFileSync(paths.rules, JSON.stringify(rules, null, 2) + '\n');
    console.log(`✅ ${paths.rules} migré : ${stats.effectsMigrated} effets convertis.`);
}

// 2. Migration de traits.json (standalone library)
if (fs.existsSync(paths.traits)) {
    const traitsBlob = JSON.parse(fs.readFileSync(paths.traits, 'utf8'));
    // Note: traits.json doesn't typically have a formulas section, 
    // but we migrate the effects so they point to IDs that should exist in rules.json
    migrateLibrary(traitsBlob);
    fs.writeFileSync(paths.traits, JSON.stringify(traitsBlob, null, 2) + '\n');
    console.log(`✅ ${paths.traits} migré.`);
}

console.log('🎉 Migration terminée !');
