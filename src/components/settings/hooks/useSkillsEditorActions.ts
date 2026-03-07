import { useState } from 'react';
import { CharacterSheetData, DotEntry, LibrarySkillEntry, SkillCategoryKey, RulesData, SkillCategoryConfig } from '../../../types';
import { DragItemType } from '../../SettingsView';

interface UseSkillsEditorActionsProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
    draggedItem: DragItemType | null;
    setDraggedItem: (item: DragItemType | null) => void;
    rules: RulesData | null;
}

export function useSkillsEditorActions({ data, onUpdate, onAddLog, draggedItem, setDraggedItem, rules }: UseSkillsEditorActionsProps) {
    const skillCategories = rules?.definitions?.skillCategories || [];

    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

    // State for Variable Skill Modal
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [pendingSkillDrop, setPendingSkillDrop] = useState<{
        libItem: LibrarySkillEntry;
        category: string;
        index: number;
    } | null>(null);
    const [variantInput, setVariantInput] = useState("");

    const getCategoryLabel = (catId: string) => {
        const found = skillCategories.find((c: SkillCategoryConfig) => c.id === catId);
        return found ? found.label : catId;
    };

    // --- CRUD LOGIC ---

    const updateSkillName = (category: SkillCategoryKey, id: string, newName: string) => {
        const list = data.skills[category];
        if (!list) return;

        onUpdate({
            ...data,
            skills: {
                ...data.skills,
                [category]: list.map(item => item.id === id ? { ...item, name: newName } : item)
            }
        });
    };

    const updateSkillVariant = (category: SkillCategoryKey, id: string, newVariant: string) => {
        const list = data.skills[category];
        if (!list) return;

        onUpdate({
            ...data,
            skills: {
                ...data.skills,
                [category]: list.map(item => item.id === id ? { ...item, variant: newVariant } : item)
            }
        });
    };

    const syncSkillWithLibrary = (name: string, category: SkillCategoryKey) => {
        if (name.trim() === '' || name === 'Nouvelle Compétence') return;

        const normName = name.trim().toLowerCase();
        let newLibrary = [...(data.skillLibrary || [])];
        const exists = newLibrary.some(l => l.name.trim().toLowerCase() === normName);

        if (!exists) {
            const newLibEntry: LibrarySkillEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: name.trim(),
                description: '',
                defaultCategory: category
            };
            newLibrary = [...newLibrary, newLibEntry].sort((a, b) => a.name.localeCompare(b.name));
            onUpdate({ ...data, skillLibrary: newLibrary });
        }
    };

    const removeSkill = (category: SkillCategoryKey, id: string) => {
        const list = data.skills[category];
        if (!list) return;

        const skillToRemove = list.find(s => s.id === id);
        if (!skillToRemove) return;

        const skillName = skillToRemove.name;

        // Return to library check
        const libList = data.skillLibrary || [];
        const existsInLib = libList.some(l => l.name.trim().toLowerCase() === skillName.trim().toLowerCase());

        let newLibrary = libList;

        if (!existsInLib && skillName.trim() !== '') {
            const newLibEntry: LibrarySkillEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: skillName,
                description: '',
                defaultCategory: category
            };
            newLibrary = [...libList, newLibEntry];
            newLibrary.sort((a, b) => a.name.localeCompare(b.name));
            onAddLog(`"${skillName}" retiré de la fiche et ajouté à la réserve`, 'info', 'settings');
        } else {
            onAddLog(`"${skillName}" retiré de la fiche (retourne en réserve)`, 'info', 'settings');
        }

        onUpdate({
            ...data,
            skillLibrary: newLibrary,
            skills: {
                ...data.skills,
                [category]: list.filter(item => item.id !== id)
            }
        });
    };

    const addSkill = (category: SkillCategoryKey, isSpacer = false, defaultName = 'Nouvelle Compétence') => {
        const list = data.skills[category] || [];
        const newId = Math.random().toString(36).substr(2, 9);
        const newSkill: DotEntry = {
            id: newId,
            name: isSpacer ? '' : defaultName,
            value: 0,
            creationValue: 0,
            max: 5,
            ...(isSpacer ? {} : { playerAdded: true })
        };

        onUpdate({
            ...data,
            skills: {
                ...data.skills,
                [category]: [...list, newSkill]
            }
        });

        if (!isSpacer) {
            setNewlyAddedId(newId);
            onAddLog(`Ajout : Nouvelle compétence dans [${getCategoryLabel(category)}]`, 'success', 'settings');
        } else {
            onAddLog(`Ajout : Espaceur dans [${getCategoryLabel(category)}]`, 'info', 'settings');
        }
    };

    // --- DRAG & DROP LOGIC ---

    const handleDragStart = (e: React.DragEvent, type: 'sheet_skill' | 'lib_skill', dataPayload: { category: string; index: number; item: DotEntry } | LibrarySkillEntry) => {
        setDraggedItem({ type, ...dataPayload });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ type, ...dataPayload }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropOnSheet = (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedItem) return;

        // 1. Reordering within Sheet
        if (draggedItem.type === 'sheet_skill') {
            const sourceCategory = draggedItem.category!;
            const sourceIndex = draggedItem.index!;

            // Same pos check
            if (sourceCategory === targetCategory && sourceIndex === targetIndex) return;

            const newSkills = { ...data.skills };
            const sourceList = [...(newSkills[sourceCategory as SkillCategoryKey] || [])];
            const targetList = (sourceCategory === targetCategory) ? sourceList : [...(newSkills[targetCategory as SkillCategoryKey] || [])];

            const [itemToMove] = sourceList.splice(sourceIndex, 1);

            targetList.splice(targetIndex, 0, itemToMove);

            newSkills[sourceCategory as SkillCategoryKey] = sourceList;
            if (sourceCategory !== targetCategory) {
                newSkills[targetCategory as SkillCategoryKey] = targetList;
            }

            onUpdate({ ...data, skills: newSkills });
        }

        // 2. Dropping from Library to Sheet
        else if (draggedItem.type === 'lib_skill') {
            const libItem = (draggedItem.data as unknown) as LibrarySkillEntry;

            // Handle Variable Skills (Option 1)
            if (libItem.isVariable) {
                setPendingSkillDrop({
                    libItem,
                    category: targetCategory,
                    index: targetIndex
                });
                setVariantInput("");
                setVariantModalOpen(true);
                setDraggedItem(null);
                return;
            }

            const newSkillEntry: DotEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: libItem.name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: undefined,
                playerAdded: true
            };

            const newSkills = { ...data.skills };
            const targetList = [...(newSkills[targetCategory as SkillCategoryKey] || [])];

            targetList.splice(targetIndex, 0, newSkillEntry);
            newSkills[targetCategory as SkillCategoryKey] = targetList;

            onUpdate({ ...data, skills: newSkills });
            onAddLog(`Importation : "${libItem.name}" depuis la réserve`, 'success', 'settings');
        }

        setDraggedItem(null);
    };

    const confirmVariableSkill = () => {
        if (!pendingSkillDrop) return;

        const { libItem, category, index } = pendingSkillDrop;
        const variant = variantInput.trim();

        const newSkillEntry: DotEntry = {
            id: Math.random().toString(36).substr(2, 9),
            name: libItem.name,
            value: 0,
            creationValue: 0,
            max: 5,
            variant: variant,
            playerAdded: true
        };

        const newSkills = { ...data.skills };
        const targetList = [...(newSkills[category as SkillCategoryKey] || [])];

        targetList.splice(index, 0, newSkillEntry);
        newSkills[category as SkillCategoryKey] = targetList;

        onUpdate({ ...data, skills: newSkills });
        const logMsg = variant
            ? `Importation : "${libItem.name} : ${variant}" depuis la réserve`
            : `Importation : "${libItem.name}" depuis la réserve`;

        onAddLog(logMsg, 'success', 'settings');

        setVariantModalOpen(false);
        setPendingSkillDrop(null);
    };

    return {
        focusedValue,
        setFocusedValue,
        newlyAddedId,
        setNewlyAddedId,
        variantModalOpen,
        setVariantModalOpen,
        pendingSkillDrop,
        setPendingSkillDrop,
        variantInput,
        setVariantInput,
        getCategoryLabel,
        updateSkillName,
        updateSkillVariant,
        syncSkillWithLibrary,
        removeSkill,
        addSkill,
        handleDragStart,
        handleDragOver,
        handleDropOnSheet,
        confirmVariableSkill,
        onAddLog
    };
}
