
import React, { useRef, useState, useEffect } from 'react';
import { CharacterSheetData, PartyColumn, PartyMemberEntry } from '../../types';
import { Plus, X, Trash2 } from 'lucide-react';

interface PartyTableProps {
    data: CharacterSheetData;
    onChange: React.Dispatch<React.SetStateAction<CharacterSheetData>>;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

const PartyTable: React.FC<PartyTableProps> = ({ data, onChange, onAddLog }) => {
    const columns = data.partyNotes?.columns || [];
    const members = data.partyNotes?.members || [];
    const staticWidths = data.partyNotes?.staticColWidths || { character: 200, player: 200 };
    const [newlyAddedColId, setNewlyAddedColId] = useState<string | null>(null);
    const resizingRef = useRef<{ colId: string | 'character' | 'player', startX: number, startWidth: number } | null>(null);

    // Calculate total minimum width required for the table based on column configs
    const totalTableWidth = 
        (staticWidths.character || 200) + 
        (staticWidths.player || 200) + 
        columns.reduce((acc, col) => acc + (col.width || 150), 0) + 
        100; // 100px buffer for fixed columns (Add button + Actions)

    useEffect(() => {
        if (newlyAddedColId) {
            const inputEl = document.getElementById(`party-col-header-${newlyAddedColId}`) as HTMLInputElement;
            if (inputEl) {
                inputEl.focus();
                inputEl.select(); 
                setNewlyAddedColId(null); 
            }
        }
    }, [columns, newlyAddedColId]);

    // ... mouse move/up effects for resizing ...
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            const { colId, startX, startWidth } = resizingRef.current;
            const delta = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + delta); 

            if (colId === 'character' || colId === 'player') {
                onChange(prev => ({
                    ...prev,
                    partyNotes: {
                        ...prev.partyNotes,
                        staticColWidths: {
                            ...prev.partyNotes.staticColWidths!,
                            [colId]: newWidth
                        }
                    }
                }));
            } else {
                onChange(prev => ({
                    ...prev,
                    partyNotes: {
                        ...prev.partyNotes,
                        columns: prev.partyNotes.columns.map(c => c.id === colId ? { ...c, width: newWidth } : c)
                    }
                }));
            }
        };

        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                document.body.style.cursor = 'default';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onChange]); 

    const startResizing = (e: React.MouseEvent, colId: string | 'character' | 'player', currentWidth: number) => {
        e.preventDefault();
        resizingRef.current = { colId, startX: e.clientX, startWidth: currentWidth };
        document.body.style.cursor = 'col-resize';
    };

    const addColumn = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newCol: PartyColumn = {
            id: newId,
            label: "Nouvelle Colonne",
            width: 150
        };
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: [...columns, newCol]
            }
        });
        setNewlyAddedColId(newId);
        onAddLog("Colonne ajoutée au groupe", 'info');
    };

    const deleteColumn = (colId: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: columns.filter(c => c.id !== colId)
            }
        });
    };

    const updateColumnLabel = (colId: string, newVal: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                columns: columns.map(c => c.id === colId ? { ...c, label: newVal } : c)
            }
        });
    };

    const addMember = () => {
        const newMember: PartyMemberEntry = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            player: '',
            data: {}
        };
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: [...members, newMember]
            }
        });
        onAddLog("Membre ajouté au groupe", 'success');
    };

    const updateMember = (memberId: string, field: 'name' | 'player' | 'data', value: any, key?: string) => {
        const newMembers = members.map(m => {
            if (m.id !== memberId) return m;
            if (field === 'data' && key) {
                return { ...m, data: { ...m.data, [key]: value } };
            }
            return { ...m, [field]: value };
        });

        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: newMembers
            }
        });
    };

    const deleteMember = (memberId: string) => {
        onChange({
            ...data,
            partyNotes: {
                ...data.partyNotes,
                members: members.filter(m => m.id !== memberId)
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col p-4">
             <div className="flex-grow overflow-auto custom-scrollbar">
                 <table 
                    className="border-collapse table-fixed bg-white shadow-sm"
                    style={{ minWidth: '100%', width: `${totalTableWidth}px` }}
                 >
                     <thead className="sticky top-0 z-10 shadow-sm">
                         <tr>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 relative" style={{ width: staticWidths.character }}>
                                <div className="truncate font-bold w-full" title="Personnage">Personnage</div>
                                <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20" onMouseDown={(e) => startResizing(e, 'character', staticWidths.character)} />
                             </th>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 border-l border-stone-300 relative" style={{ width: staticWidths.player }}>
                                <div className="truncate font-bold w-full" title="Joueur">Joueur</div>
                                <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20" onMouseDown={(e) => startResizing(e, 'player', staticWidths.player)} />
                             </th>
                             {columns.map(col => (
                                 <th key={col.id} className="border-b-2 border-stone-400 bg-[#f6f3ed] text-left p-2 font-serif text-stone-700 border-l border-stone-300 group relative" style={{ width: col.width || 150 }}>
                                     <input 
                                        id={`party-col-header-${col.id}`}
                                        className="bg-transparent font-bold w-full outline-none focus:border-b border-indigo-500 pr-6 truncate" 
                                        value={col.label}
                                        title={col.label}
                                        onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                                     />
                                     <button onClick={() => deleteColumn(col.id)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Supprimer colonne">
                                         <X size={14} />
                                     </button>
                                     <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-stone-300 z-20" onMouseDown={(e) => startResizing(e, col.id, col.width || 150)} />
                                 </th>
                             ))}
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] p-2 w-12 text-center align-middle">
                                 <button onClick={addColumn} className="text-stone-500 hover:text-indigo-600 transition-colors flex justify-center w-full" title="Ajouter une colonne">
                                     <Plus size={20} />
                                 </button>
                             </th>
                             <th className="border-b-2 border-stone-400 bg-[#f6f3ed] w-12"></th>
                         </tr>
                     </thead>
                     <tbody>
                         {members.map(member => (
                             <tr key={member.id} className="hover:bg-stone-50 group">
                                 <td className="p-0 border-b border-stone-300 h-10 overflow-hidden">
                                     <input className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-ink outline-none" placeholder="Nom du perso..." value={member.name} onChange={(e) => updateMember(member.id, 'name', e.target.value)} />
                                 </td>
                                 <td className="p-0 border-b border-stone-300 h-10 border-l border-stone-200 overflow-hidden">
                                     <input className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-ink outline-none" placeholder="Nom du joueur..." value={member.player} onChange={(e) => updateMember(member.id, 'player', e.target.value)} />
                                 </td>
                                 {columns.map(col => (
                                     <td key={col.id} className="p-0 border-b border-stone-300 h-10 border-l border-stone-200 overflow-hidden">
                                         <input className="w-full h-full bg-transparent px-2 font-handwriting text-lg text-stone-600 outline-none" value={member.data[col.id] || ''} onChange={(e) => updateMember(member.id, 'data', e.target.value, col.id)} />
                                     </td>
                                 ))}
                                 <td colSpan={2} className="border-b border-stone-300 text-center w-24">
                                     <button onClick={() => deleteMember(member.id)} className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2">
                                         <Trash2 size={16} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                         
                         {/* Button Row - Visible directly after entries or as first entry if empty */}
                         <tr 
                            onClick={addMember}
                            className="hover:bg-indigo-50/50 transition-colors cursor-pointer group/add h-10 border-b border-dashed border-stone-300"
                         >
                             <td colSpan={columns.length + 4} className="p-0 text-center align-middle">
                                <button className="flex items-center gap-2 text-stone-400 group-hover/add:text-indigo-600 font-bold uppercase text-xs tracking-wider mx-auto transition-colors w-full h-full justify-center py-2">
                                     <Plus size={16} /> Ajouter un Membre
                                 </button>
                             </td>
                         </tr>
                     </tbody>
                 </table>
             </div>
        </div>
    );
};

export default PartyTable;
