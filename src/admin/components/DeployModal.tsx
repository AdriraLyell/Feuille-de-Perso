
import React, { useState } from 'react';
import { generateRulesJSContent } from '../utils/rulesGenerator';
import { RulesData } from '../../types/rules';
import { Save, AlertTriangle, CheckCircle, Loader2, Github, RefreshCw } from 'lucide-react';
import { APP_VERSION, REMOTE_MANIFEST_URL } from '../../constants';

interface DeployToGithubModalProps {
    isOpen: boolean;
    onClose: () => void;
    rules: RulesData;
    onDeploySuccess?: (sha: string, token: string) => void;
}

const DeployToGithubModal: React.FC<DeployToGithubModalProps> = ({ isOpen, onClose, rules, onDeploySuccess }) => {
    const [token, setToken] = useState<string>(localStorage.getItem('GITHUB_TOKEN') || '');
    const [repoOwner, setRepoOwner] = useState<string>(localStorage.getItem('GITHUB_OWNER') || 'AdriraLyell');
    const [repoName, setRepoName] = useState<string>(localStorage.getItem('GITHUB_REPO') || 'Feuille-de-Perso');
    const [filePath, setFilePath] = useState<string>('public/data/rules.js');
    const [branch, setBranch] = useState<string>('main');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    // Version Check State
    const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
    const [isStale, setIsStale] = useState<boolean>(false);

    // Check for "Stale Admin" on mount
    React.useEffect(() => {
        if (isOpen) {
            checkRemoteVersion();
        }
    }, [isOpen]);

    const checkRemoteVersion = async () => {
        try {
            const res = await fetch(`${REMOTE_MANIFEST_URL}?t=${Date.now()}`); // Burst cache
            if (res.ok) {
                const manifest = await res.json();
                if (manifest.version && manifest.version !== APP_VERSION) {
                    setRemoteVersion(manifest.version);
                    // Simple string compare or semver? Assuming exact match needed for "freshness".
                    // If remote is different, it's likely newer (or we rolled back).
                    // Let's assume different = potential issue if remote > local.
                    // For now, simpler: if different, warn.
                    setIsStale(manifest.version > APP_VERSION);
                }
            }
        } catch (e) {
            console.warn("Utils: Version check failed", e);
        }
    };

    if (!isOpen) return null;

    const saveCredentials = () => {
        localStorage.setItem('GITHUB_TOKEN', token);
        localStorage.setItem('GITHUB_OWNER', repoOwner);
        localStorage.setItem('GITHUB_REPO', repoName);
    };

    const handleDeploy = async () => {
        if (!token || !repoOwner || !repoName) {
            setStatus('error');
            setMessage('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        setStatus('loading');
        setMessage('Préparation du déploiement...');
        saveCredentials();

        try {
            // 1. Get current SHA of the file (if it exists)
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;

            let sha = '';

            try {
                const checkRes = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (checkRes.ok) {
                    const data = await checkRes.json();
                    sha = data.sha;
                } else if (checkRes.status === 404) {
                    // File doesn't exist, that's fine, we create it
                } else {
                    throw new Error(`Erreur GitHub (${checkRes.status}): ${checkRes.statusText}`);
                }
            } catch (err) {
                // Ignore network errors here, proceed to try writing
                console.warn("Check file skipped or failed", err);
            }

            // 2. Prepare content
            const content = generateRulesJSContent(rules);
            // GitHub requires Base64
            // Using btoa with UTF-8 fix for special chars (accents)
            const base64Content = btoa(unescape(encodeURIComponent(content)));

            // 3. Push File
            const pushRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `update(rules): Mise à jour automatique depuis Admin App v${rules.version}`,
                    content: base64Content,
                    branch: branch,
                    sha: sha || undefined // Only include SHA if file existed
                })
            });

            if (!pushRes.ok) {
                const errData = await pushRes.json();
                throw new Error(errData.message || 'Erreur lors du déploiement');
            }

            const successData = await pushRes.json();
            const newCommitSha = successData.commit?.sha;

            setStatus('success');
            setMessage('Fichier rules.js mis à jour avec succès ! Le déploiement GitHub Pages devrait démarrer.');

            if (onDeploySuccess && newCommitSha) {
                onDeploySuccess(newCommitSha, token);
            }

        } catch (error) {
            setStatus('error');
            setMessage((error as Error).message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Github size={20} className="text-white" />
                        Publier sur GitHub
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">

                    {isStale && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 flex items-start gap-2 animate-pulse">
                            <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-red-600" />
                            <div>
                                <p className="font-bold">⚠️ Version Obsolète Détectée !</p>
                                <p className="text-xs mt-1">
                                    Vous utilisez l'Admin <strong>v{APP_VERSION}</strong> mais une version plus récente (<strong>v{remoteVersion}</strong>) est disponible en ligne.
                                </p>
                                <p className="text-xs mt-1 font-bold">
                                    Veuillez rafraîchir cette page (F5) avant de publier pour éviter des erreurs de version.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <p>
                            Cette action va directement modifier <code>public/rules.js</code> sur votre dépôt GitHub.
                            Cela déclenchera une reconstruction automatique (GitHub Actions).
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Utilisateur / Orga</label>
                            <input
                                value={repoOwner}
                                onChange={(e) => setRepoOwner(e.target.value)}
                                className="w-full border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none text-sm"
                                placeholder="ex: AdriraLyell"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Dépôt</label>
                            <input
                                value={repoName}
                                onChange={(e) => setRepoName(e.target.value)}
                                className="w-full border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none text-sm"
                                placeholder="ex: Feuille-de-Perso"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">GitHub Token (PAT)</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1.5 focus:border-blue-500 outline-none text-sm font-mono"
                            placeholder="ghp_..."
                        />
                        <p className="text-[10px] text-slate-400">
                            Nécessite la permission <code>public_repo</code> ou <code>Contents: Write</code>.
                            Sauvegardé localement dans votre navigateur.
                        </p>
                    </div>

                    {status === 'error' && (
                        <div className="bg-red-50 text-red-700 p-3 rounded text-sm border border-red-200">
                            <strong>Erreur :</strong> {message}
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="bg-green-50 text-green-700 p-3 rounded text-sm border border-green-200">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold flex items-center gap-2"><CheckCircle size={16} /> {message}</span>
                                <a
                                    href={`https://github.com/${repoOwner}/${repoName}/blob/${branch}/${filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs underline hover:text-green-900 ml-6"
                                >
                                    Vérifier le fichier sur GitHub
                                </a>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium text-sm transition-colors"
                    >
                        Fermer
                    </button>
                    {status !== 'success' && (
                        <button
                            onClick={handleDeploy}
                            disabled={status === 'loading'}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Publier
                        </button>
                    )}
                </div>

            </div>
        </div >
    );
};

export default DeployToGithubModal;
