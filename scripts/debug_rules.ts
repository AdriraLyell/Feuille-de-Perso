
import fs from 'fs';
import path from 'path';
import { INITIAL_DATA } from '../src/data/initialState';
import { applyRulesToState } from '../src/utils/rulesAdapter';
import { RulesData } from '../src/types/rules';

const rulesPath = path.join(process.cwd(), 'public/data/rules.json');

try {
    const rawRules = fs.readFileSync(rulesPath, 'utf-8');
    const rules = JSON.parse(rawRules) as RulesData;

    console.log('--- Original Rules ---');
    console.log('Starting XP:', rules.configurations.creation.startingXP);
    console.log('Mode:', rules.configurations.creation.mode);

    // Simulate User Edit
    rules.configurations.creation.startingXP = 999;
    rules.configurations.creation.mode = 'points'; // Force points to make it visible in HUD logic

    console.log('\n--- Applied Override (Simulated) ---');
    console.log('Starting XP:', rules.configurations.creation.startingXP);

    console.log('\n--- Running ApplyRulesToState ---');
    const newState = applyRulesToState(INITIAL_DATA, rules);

    console.log('Resulting State CreationConfig:');
    console.log(JSON.stringify(newState.creationConfig, null, 2));

    if (newState.creationConfig.startingXP === 999) {
        console.log('\nSUCCESS: Logic is correct. startingXP updated to 999.');
    } else {
        console.error('\nFAILURE: startingXP is ' + newState.creationConfig.startingXP);
    }

} catch (err) {
    console.error('Error running debug script:', err);
}
