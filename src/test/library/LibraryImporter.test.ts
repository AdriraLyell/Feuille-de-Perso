/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LibraryImporter } from '../../services/library/LibraryImporter';
import { DatabaseService } from '../../services/DatabaseService';

// Mock DatabaseService
vi.mock('../../services/DatabaseService', () => ({
    DatabaseService: {
        fetchAll: vi.fn(),
        insert: vi.fn()
    }
}));

describe('LibraryImporter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should filter out existing skills (case insensitive) before import', async () => {
        // Mock existing skills in DB
        (DatabaseService.fetchAll as any).mockResolvedValue([
            { name: 'Athlétisme' },
            { name: 'Discrétion' }
        ]);
        (DatabaseService.insert as any).mockResolvedValue(true);

        const newSkills = [
            { id: '1', name: 'Athlétisme', defaultCategory: 'physical', isVariable: false, description: '' }, // Duplicate (exact)
            { id: '2', name: 'discrétion', defaultCategory: 'physical', isVariable: false, description: '' }, // Duplicate (case)
            { id: '3', name: 'Bagarre', defaultCategory: 'physical', isVariable: false, description: '' } // New
        ];

        await LibraryImporter.importSkills('campaign-1', newSkills);

        // Should have fetched existing skills
        expect(DatabaseService.fetchAll).toHaveBeenCalledWith(
            'libraries_skills',
            { eq: { setting_id: 'campaign-1' }, select: 'name' },
            expect.any(String)
        );

        // Should only insert 'Bagarre'
        expect(DatabaseService.insert).toHaveBeenCalledTimes(1);
        const insertCall = (DatabaseService.insert as any).mock.calls[0];
        expect(insertCall[0]).toBe('libraries_skills');
        expect(insertCall[1]).toHaveLength(1);
        expect(insertCall[1][0].name).toBe('Bagarre');
    });

    it('should insert all if no duplicates found', async () => {
        (DatabaseService.fetchAll as any).mockResolvedValue([]);
        (DatabaseService.insert as any).mockResolvedValue(true);

        const newSkills = [
            { id: '1', name: 'Nage', defaultCategory: 'physical', isVariable: false, description: '' }
        ];

        await LibraryImporter.importSkills(null, newSkills); // Global import

        expect(DatabaseService.insert).toHaveBeenCalledWith(
            'libraries_skills',
            expect.arrayContaining([
                expect.objectContaining({ name: 'Nage' })
            ]),
            expect.any(String)
        );
    });

    it('should do nothing if all are duplicates', async () => {
        (DatabaseService.fetchAll as any).mockResolvedValue([{ name: 'Existing' }]);

        await LibraryImporter.importSkills('campaign-1', [
            { id: '1', name: 'EXISTING', defaultCategory: 'cat', isVariable: false, description: '' }
        ]);

        expect(DatabaseService.insert).not.toHaveBeenCalled();
    });
});

