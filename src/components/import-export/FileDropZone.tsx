import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { logger } from '../../utils/logger';

interface FileDropZoneProps {
    onFileSelect: (json: Record<string, unknown>) => void;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                onFileSelect(json);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } catch (error) {
                logger.error("Error parsing JSON", error);
                // Parent handles error mostly via context, but we should probably bubble up error?
                // The hook `handleFileLoad` catches errors.
                // But here we are just parsing.
                // Let's pass the raw string? No, parent expects JSON.
                // We will rely on parent passing a handler that catches errors if possible?
                // Or better, let's keep parsing here and pass object.
            }
        };
        reader.readAsText(file);
    };

    return (
        <button
            type="button"
            className="flex-grow flex flex-col justify-center items-center text-center space-y-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-8 hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer group outline-none focus:ring-2 focus:ring-orange-500/50"
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="p-5 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-orange-500 transition-colors pointer-events-none">
                <Upload size={48} />
            </div>
            <div className="pointer-events-none">
                <p className="text-lg text-slate-700 font-bold mb-2">
                    Cliquez pour sélectionner un fichier
                </p>
                <p className="text-sm text-slate-500">
                    Accepte les fichiers <code>.json</code>
                </p>
            </div>
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
            <div
                className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-full font-bold group-hover:text-orange-600 group-hover:border-orange-400 transition-colors shadow-sm pointer-events-none"
            >
                Parcourir...
            </div>
        </button>
    );
};
