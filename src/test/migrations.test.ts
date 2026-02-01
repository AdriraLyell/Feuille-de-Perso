import { describe, it, expect } from 'vitest';
import { migrateData } from '../utils/migrations';
import { INITIAL_DATA } from '../data/initialState';

describe('Data Migrations', () => {
    it('should migrate old Terminology (Vertus -> Avantages)', () => {
        const oldData = {
            page2: {
                vertus: [{ name: 'Test Vertu', value: '1' }],
                defauts: [{ name: 'Test Defaut', value: '2' }]
            }
        };

        const result = migrateData(oldData);

        expect(result.page2.avantages).toBeDefined();
        expect(result.page2.avantages[0].name).toBe('Test Vertu');
        expect(result.page2.desavantages).toBeDefined();
        expect(result.page2.desavantages[0].name).toBe('Test Defaut');
        // @ts-ignore
        expect(result.page2.vertus).toBeUndefined();
    });

    it('should convert old numeric attributes to strings', () => {
        const oldData = {
            attributes: {
                physique: [{ name: 'Force', val1: 3, val2: 0, val3: 0, id: '1' }]
            }
        };

        const result = migrateData(oldData);

        expect(typeof result.attributes.physique[0].val1).toBe('string');
        expect(result.attributes.physique[0].val1).toBe('3');
        expect(result.attributes.physique[0].val2).toBe('');
    });

    it('should pre-fill skill library if missing', () => {
        const oldData = {
            skills: {
                talents: [{ name: 'Acrobatie', value: 2, id: '1' }]
            }
        };

        const result = migrateData(oldData);

        expect(result.skillLibrary).toBeDefined();
        expect(result.skillLibrary.some(s => s.name === 'Acrobatie')).toBe(true);
    });
});
