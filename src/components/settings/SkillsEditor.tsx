
import React, { useState } from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey, LibrarySkillEntry } from '../../types';
import { Minus, Plus, GripVertical, Trash2 } from 'lucide-react';

interface SkillsEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
    draggedItem: { type: 'sheet_skill' | 'lib_skill', category?: string, index?: number, id?: string, data?: any } | null;
    setDraggedItem: (item: any) => void;
}

const SkillsEditor: React.FC<SkillsEditorProps> = ({ data, onUpdate, onAddLog, draggedItem, setDraggedItem }) => {
    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

    const getCategoryLabel = (cat: string) => {
        switch(cat) {
            case 'talents': return 'Talents (Col 1)';
            case 'competences': return 'Compétences (Col 2)';
            case 'competences_col_2': return 'Compétences (Col 3)';
            case 'connaissances': return 'Connaissances (Col 4)';
            case 'autres_competences': return 'Autres Compétences';
            case 'competences2': return 'Compétences Secondaires';
            case 'autres': return 'Autres';
            case 'arrieres_plans': return 'Arrières Plans';
            case 'counters': return 'Compteurs';
            default: return cat;
        }
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
            max: 5
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

    // --- COUNTER LOGIC ---

    const updateCounterName = (id: string, newName: string) => {
        const custom = data.counters.custom;
        if (!custom) return;

        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: custom.map(c => c.id === id ? { ...c, name: newName } : c)
            }
        });
    };

    const removeCounter = (id: string) => {
        const custom = data.counters.custom;
        if (!custom) return;

        const counterName = custom.find(c => c.id === id)?.name;
        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: custom.filter(c => c.id !== id)
            }
        });
        onAddLog(`Suppression Compteur : ${counterName}`, 'danger', 'settings');
    };

    const addCounter = (defaultName = 'Nouveau Compteur') => {
        const newId = Math.random().toString(36).substr(2, 9);
        const custom = data.counters.custom || [];
        const newCounter: DotEntry = {
            id: newId,
            name: defaultName,
            value: 0,
            creationValue: 0,
            max: 10
        };
        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: [...custom, newCounter]
            }
        });
        setNewlyAddedId(newId);
        onAddLog(`Ajout : Compteur personnalisé`, 'success', 'settings');
    };

    // --- DRAG & DROP LOGIC ---

    const handleDragStart = (e: React.DragEvent, type: 'sheet_skill' | 'lib_skill', dataPayload: any) => {
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

            // Counters special case
            if (sourceCategory === 'counters') {
                 if (targetCategory !== 'counters') return; 
                 const newList = [...(data.counters.custom || [])];
                 const [itemToMove] = newList.splice(sourceIndex, 1);
                 newList.splice(targetIndex, 0, itemToMove);
                 onUpdate({ ...data, counters: { ...data.counters, custom: newList } });
                 setDraggedItem(null);
                 return;
            }

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
            const libItem = draggedItem.data as LibrarySkillEntry;
            
            // Create new Sheet Entry
            const newSkillEntry: DotEntry = {
                id: Math.random().toString(36).substr(2, 9), 
                name: libItem.name,
                value: 0,
                creationValue: 0,
                max: 5
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

    const renderCategoryEditor = (title: string, category: string, heightClass = 'h-full', defaultItemName = 'Nouvelle Compétence') => {
        const isCounters = category === 'counters';
        // @ts-ignore
        const list: DotEntry[] = isCounters ? (data.counters?.custom || []) : (data.skills?.[category as SkillCategoryKey] || []);

        return (
          <div 
            className={`bg-white p-4 rounded shadow flex flex-col ${heightClass} border-2 border-transparent transition-colors ${draggedItem && !isCounters ? 'border-dashed border-blue-200 bg-blue-50/30' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => !isCounters && handleDropOnSheet(e, category, list.length)}
          >
            <h3 className="font-bold text-sm mb-4 text-gray-800 border-b pb-2 flex justify-between items-center select-none">
              {title}
              <div className="flex gap-1">
                   {!isCounters && (
                       <button
                        onClick={() => addSkill(category as SkillCategoryKey, true)}
                        className="text-[10px] bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-600 transition-colors"
                        title="Ajouter un espaceur"
                        >
                            <Minus size={12} /> Espace
                        </button>
                   )}
                  <button
                      onClick={() => isCounters ? addCounter(defaultItemName) : addSkill(category as SkillCategoryKey, false, defaultItemName)}
                      className="text-[10px] bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-green-700 transition-colors"
                  >
                      <Plus size={12} /> Ajouter
                  </button>
              </div>
            </h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[500px] min-h-[50px] custom-scrollbar">
              {list.length === 0 && !isCounters && (
                   <div className="h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs pointer-events-none">
                      Déposez ici
                   </div>
              )}
              {list.map((item, index) => {
                const isDragging = draggedItem?.type === 'sheet_skill' && draggedItem?.category === category && draggedItem?.index === index;
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-2 text-sm group transition-all duration-200 p-1 rounded ${isDragging ? 'opacity-50 bg-gray-100' : 'hover:bg-gray-50'}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'sheet_skill', { category, index, item })}
                    onDragOver={handleDragOver}
                    onDrop={(e) => { e.stopPropagation(); handleDropOnSheet(e, category, index); }}
                  >
                     <div className="cursor-grab text-gray-300 hover:text-gray-600 active:cursor-grabbing p-1">
                        <GripVertical size={16} />
                     </div>
                     <span className="text-gray-400 text-xs w-4 text-center select-none">{index + 1}</span>
                     
                     {item.name === '' ? (
                         <div className="flex-grow h-8 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 italic cursor-default select-none">
                            Espaceur (Vide)
                         </div>
                     ) : (
                        <input
                        type="text"
                        autoFocus={item.id === newlyAddedId}
                        value={item.name}
                        onFocus={(e) => {
                            setFocusedValue(e.target.value);
                            if (e.target.value === defaultItemName) {
                                e.target.select();
                            }
                        }}
                        onBlur={(e) => {
                            if (item.id === newlyAddedId) {
                                setNewlyAddedId(null);
                            }
                            if (focusedValue !== null && e.target.value !== focusedValue) {
                                const label = isCounters ? "Compteurs" : getCategoryLabel(category);
                                onAddLog(`Modification : "${focusedValue}" renommé en "${e.target.value}" dans [${label}]`, 'info', 'settings');
                            }
                            setFocusedValue(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        onChange={(e) => isCounters ? updateCounterName(item.id, e.target.value) : updateSkillName(category as SkillCategoryKey, item.id, e.target.value)}
                        className="border p-1 rounded w-full focus:border-blue-500 outline-none bg-transparent"
                        />
                     )}
                    <button
                      onClick={() => isCounters ? removeCounter(item.id) : removeSkill(category as SkillCategoryKey, item.id)}
                      className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer (remettre en réserve)"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
             <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderCategoryEditor("Talents (Col 1)", "talents")}
                    {renderCategoryEditor("Compétences (Col 2)", "competences")}
                    {renderCategoryEditor("Compétences (Col 3)", "competences_col_2")}
                    {renderCategoryEditor("Connaissances (Col 4)", "connaissances")}
                </div>
             </div>
             <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderCategoryEditor("Autres Compétences", "autres_competences")}
                    {renderCategoryEditor("Compétences Secondaires", "competences2")}
                    {renderCategoryEditor("Autres", "autres")}
                    {renderCategoryEditor("Arrières Plans", "arrieres_plans", "h-full", "Nouvel Arrière Plan")}
                </div>
             </div>
             <div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {renderCategoryEditor("Compteurs", "counters", "h-full", "Nouveau Compteur")}
                 </div>
             </div>
        </div>
    );
};

export default SkillsEditor;
