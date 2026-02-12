import { useState, useEffect, useCallback } from 'react';
import { CharacterSheetData, LibraryEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { normalizeString } from '../../utils/stringUtils';

export const useTraitEditor = (
    data: CharacterSheetData,
    rules: RulesData | null,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', detail?: string) => void
) => {
    const [editingSlot, setEditingSlot] = useState<{ type: 'avantages' | 'desavantages', index: number } | null>(null);
    const [showLibraryInEditor, setShowLibraryInEditor] = useState(false);
    const [multiSelectTarget, setMultiSelectTarget] = useState<'avantages' | 'desavantages' | null>(null);

    const [editorName, setEditorName] = useState('');
    const [editorValue, setEditorValue] = useState('');
    const [editorTag, setEditorTag] = useState('');
    const [editorVariant, setEditorVariant] = useState('');
    const [editorVariants, setEditorVariants] = useState<string[]>([]);
    const [editorDescription, setEditorDescription] = useState('');
    const [editorDefinitionId, setEditorDefinitionId] = useState<string | undefined>(undefined);
    const [editorIsVariable, setEditorIsVariable] = useState(false);

    useEffect(() => {
        if (editingSlot) {
            const item = data.page2[editingSlot.type][editingSlot.index];
            setEditorName(item.name);
            setEditorValue(item.value);
            setEditorDescription(item.description || '');
            setEditorTag(item.tag || '');
            setEditorVariant(item.variant || '');

            let defId = item.definitionId;
            let variants: string[] = [];

            const libEntry = rules?.libraries?.traits?.find(t =>
                (defId && t.id === defId) ||
                normalizeString(t.name) === normalizeString(item.name)
            );

            if (libEntry) {
                defId = libEntry.id;
                variants = libEntry.variants || [];
                setEditorIsVariable(libEntry.isVariable || false);
            } else {
                setEditorIsVariable(false);
            }

            setEditorDefinitionId(defId);
            setEditorVariants(variants);
        }
    }, [editingSlot, data.page2, rules?.libraries?.traits]);

    const openEditor = (type: 'avantages' | 'desavantages', index: number) => {
        setEditingSlot({ type, index });
    };

    const closeEditor = () => {
        setEditingSlot(null);
        setShowLibraryInEditor(false);
    };

    const saveTraitFromEditor = () => {
        if (!editingSlot) return;
        const newList = [...data.page2[editingSlot.type]];
        newList[editingSlot.index] = {
            name: editorName,
            value: editorValue,
            description: editorDescription,
            tag: editorTag,
            variant: editorVariant,
            definitionId: editorDefinitionId
        };
        onChange({ ...data, page2: { ...data.page2, [editingSlot.type]: newList } });
        onAddLog(`Modification ${editingSlot.type === 'avantages' ? 'Avantage' : 'Désavantage'}`, 'info', 'sheet');
        closeEditor();
    };

    const removeTrait = (type: 'avantages' | 'desavantages', index: number) => {
        const list = [...data.page2[type]];
        list[index] = { name: '', value: '', variant: '', description: '', tag: '', definitionId: undefined };
        onChange({ ...data, page2: { ...data.page2, [type]: list } });
        onAddLog(`Suppression ${type === 'avantages' ? 'Avantage' : 'Désavantage'}`, 'info', 'sheet');
    };

    const handleMultiAdd = (instances: { entry: LibraryEntry; variant?: string }[]) => {
        if (!multiSelectTarget) return;
        const currentList = [...data.page2[multiSelectTarget]];
        let addedCount = 0;
        let listIndex = 0;
        instances.forEach(instance => {
            const entry = instance.entry;
            while (listIndex < currentList.length && currentList[listIndex].name.trim() !== '') { listIndex++; }
            if (listIndex < currentList.length) {
                currentList[listIndex] = {
                    name: entry.name,
                    value: entry.cost,
                    description: entry.description,
                    tag: entry.tags?.[0] || '',
                    variant: instance.variant || '',
                    definitionId: entry.id
                };
                addedCount++;
            }
        });
        if (addedCount > 0) {
            onChange({ ...data, page2: { ...data.page2, [multiSelectTarget]: currentList } });
            onAddLog(`Ajout de ${addedCount} traits.`, 'success', 'sheet');
        }
        setMultiSelectTarget(null);
    };

    const clearEditor = () => {
        setEditorName('');
        setEditorValue('');
        setEditorDescription('');
        setEditorTag('');
        setEditorVariant('');
        setEditorVariants([]);
        setEditorIsVariable(false);
    };

    return {
        editingSlot, setEditingSlot,
        showLibraryInEditor, setShowLibraryInEditor,
        multiSelectTarget, setMultiSelectTarget,
        editorName, setEditorName,
        editorValue, setEditorValue,
        editorTag, setEditorTag,
        editorVariant, setEditorVariant,
        editorVariants, setEditorVariants,
        editorDescription, setEditorDescription,
        editorIsVariable, setEditorIsVariable,
        editorDefinitionId, setEditorDefinitionId,
        openEditor,
        closeEditor,
        saveTraitFromEditor,
        removeTrait,
        handleMultiAdd,
        clearEditor
    };
};
