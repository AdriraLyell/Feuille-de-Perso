
import React, { useEffect, useState } from 'react';
import { APP_VERSION, REMOTE_MANIFEST_URL } from '../constants';
import { Sparkles, RefreshCw, Download, X } from 'lucide-react';

interface VersionManifest {
    version: string;
    downloadUrl?: string;
}

// Compare semantic versions (simple implementation)
const isNewer = (remote: string, local: string) => {
    const rParts = remote.split('.').map(Number);
    const lParts = local.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if (rParts[i] > lParts[i]) return true;
        if (rParts[i] < lParts[i]) return false;
    }
    return false;
};

const UpdateNotifier: React.FC = () => {
    const [updateAvailable, setUpdateAvailable] = useState<VersionManifest | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const checkVersion = async () => {
            if (!REMOTE_MANIFEST_URL || REMOTE_MANIFEST_URL.includes("votre-site-web")) return;
            
            setIsChecking(true);
            try {
                // Add timestamp to prevent caching
                const response = await fetch(`${REMOTE_MANIFEST_URL}?t=${Date.now()}`);
                if (response.ok) {
                    const manifest: VersionManifest = await response.json();
                    if (manifest.version && isNewer(manifest.version, APP_VERSION)) {
                        setUpdateAvailable(manifest);
                    }
                }
            } catch (error) {
                console.warn("Impossible de vérifier la mise à jour", error);
            } finally {
                setIsChecking(false);
            }
        };

        // Check immediately on load
        checkVersion();
        
        // Optional: Check every hour if tab stays open
        const interval = setInterval(checkVersion, 3600000);
        return () => clearInterval(interval);
    }, []);

    if (!updateAvailable || !isVisible) return null;

    const isLocalFile = window.location.protocol === 'file:';

    return (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-right-10 duration-500 no-print">
            <div className="bg-[#fdfbf7] border-2 border-stone-800 rounded-lg shadow-2xl p-4 max-w-sm relative overflow-hidden">
                
                {/* Decorative "Wax Seal" background effect */}
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-800/10 rounded-full blur-xl pointer-events-none"></div>

                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-stone-400 hover:text-stone-800 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex gap-3 items-start">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-full border border-amber-200 mt-1">
                        <Sparkles size={20} />
                    </div>
                    
                    <div>
                        <h4 className="font-serif font-bold text-lg text-indigo-950 leading-none mb-1">
                            Mise à jour disponible
                        </h4>
                        <p className="text-xs text-stone-600 mb-3 font-medium">
                            Version <span className="font-mono bg-stone-100 px-1 rounded text-stone-800">{updateAvailable.version}</span> détectée. 
                            (Actuelle : {APP_VERSION})
                        </p>

                        {isLocalFile ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] text-stone-500 italic leading-tight mb-1">
                                    Vous utilisez la version fichier (hors ligne). Veuillez télécharger le nouveau fichier.
                                </p>
                                <a 
                                    href={updateAvailable.downloadUrl || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-900 text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm"
                                >
                                    <Download size={14} /> Télécharger
                                </a>
                            </div>
                        ) : (
                            <button 
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm w-full"
                            >
                                <RefreshCw size={14} /> Actualiser la page
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateNotifier;
