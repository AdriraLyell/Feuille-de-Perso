import React, { useState } from 'react';
import { LibrarySkillEntry } from '../../types';
import LibrarySkillForm from '../library/LibrarySkillForm';
import { useRules } from '../../context/RulesContext';

interface AdminSkillIntegratorProps {
    initialData: LibrarySkillEntry;
    onClose: () => void;
    onIntegrate: (finalSkill: LibrarySkillEntry) => void;
}

const AdminSkillIntegrator: React.FC<AdminSkillIntegratorProps> = ({ initialData, onClose, onIntegrate }) => {
    const { rules } = useRules();
    const skillCategories = rules?.definitions?.skillCategories?.map(c => ({ code: c.id, label: c.label })) || [];

    const [editForm, setEditForm] = useState<LibrarySkillEntry>({
        ...initialData,
        id: Math.random().toString(36).substr(2, 9), // New ID
        isGlobal: true, // Mark official
    });
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        if (!editForm.name.trim()) { setError("Le nom de la compétence est requise."); return; }

        const isDuplicate = rules?.libraries?.skills?.some(s => s.name.trim().toLowerCase() === editForm.name.trim().toLowerCase() && s.id !== editForm.id);
        if (isDuplicate) {
            setError("Cette compétence existe déjà officiellement.");
            return;
        }

        onIntegrate(editForm);
    };

    return (
        <LibrarySkillForm
            isOpen={true}
            onClose={onClose}
            title="Officialiser la Compétence"
            skill={editForm}
            onSkillChange={setEditForm}
            onSave={handleSave}
            error={error}
            isOfficial={false} // WE WANT THE MJ TO EDIT EVERYTHING
            categories={skillCategories}
        />
    );
};

export default AdminSkillIntegrator;
