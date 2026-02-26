import { evaluateFormula } from './src/utils/formulaEvaluator';

const data: any = {
    attributes: {
        att1: [{ name: 'Constitution', val1: '2', val2: '1', val3: '1' }]
    },
    skills: {
        col1: [{ name: 'Cartomancie', value: 3, mysticAbilityId: 'magie' }],
        col2: [{ name: 'Astrologie', value: 2, mysticAbilityId: 'magie' }],
        col3: [{ name: 'Bagarre', value: 4 }]
    },
    formulaLibrary: [
        {
            id: '1',
            type: 'variable',
            code: 'SUM_HABILITES_MYSTIQUES',
            aggregateConfig: {
                target: 'skills',
                filterTarget: 'tag',
                filterValue: 'Mystique',
                operation: 'sum'
            }
        }
    ]
};

const result = evaluateFormula('10 + Constitution + SUM_HABILITES_MYSTIQUES', data);
console.log('Result:', result);
