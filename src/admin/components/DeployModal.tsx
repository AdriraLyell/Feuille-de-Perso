
import React, { useState } from 'react';
import { generateRulesJSContent } from '../utils/rulesGenerator';
import { publishFileToGitHub } from '../../services/githubService';
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

    const [status, setStatus] = useState<'idle' | 'loading' | 'building' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const [statusDetail, setStatusDetail] = useState<string>('');

    // Restore saveCredentials
    const saveCredentials = () => {
        localStorage.setItem('GITHUB_TOKEN', token);
        localStorage.setItem('GITHUB_OWNER', repoOwner);
        localStorage.setItem('GITHUB_REPO', repoName);
    };

    if (!isOpen) return null;

    // ... (rest of the file)

    const handleDeploy = async () => {
        if (!token || !repoOwner || !repoName) {
            setStatus('error');
            setMessage('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        setStatus('loading');
        setMessage('Préparation du déploiement...');
        saveCredentials();

        // 1. Publish File
        const content = generateRulesJSContent(rules);
        const commitMessage = `update(rules): Mise à jour automatique depuis Admin App v${rules.version}`;

        const connectConfig = {
            token,
            owner: repoOwner,
            repo: repoName,
            branch: branch
        };

        const result = await publishFileToGitHub(
            filePath,
            content,
            commitMessage,
            connectConfig
        );

        if (!result.success) {
            setStatus('error');
            setMessage(result.message || 'Erreur inconnue lors du déploiement.');
            return;
        }

        // 2. Monitor Build
        setStatus('building');
        setMessage('Fichier envoyé. Attente du démarrage du déploiement GitHub Pages...');

        // Wait a few seconds for GitHub to trigger the workflow
        await new Promise(r => setTimeout(r, 5000));

        let run = await import('../../services/githubService').then(m => m.getLatestWorkflowRun(connectConfig));

        // Ensure we got a VERY recent run (created in the last minute)
        // If the latest run is old, we poll a bit to see if a new one appears
        let attempts = 0;
        while (attempts < 5) {
            const runDate = run ? new Date(run.created_at).getTime() : 0;
            const now = Date.now();
            // If run is older than 2 minutes, it's likely the previous one
            if (!run || (now - runDate > 120000)) {
                await new Promise(r => setTimeout(r, 3000));
                run = await import('../../services/githubService').then(m => m.getLatestWorkflowRun(connectConfig));
                attempts++;
            } else {
                break;
            }
        }

        if (!run) {
            setStatus('success'); // Downgrade to simple success if we can't track
            setMessage('Fichier mis à jour ! (Impossible de suivre le déploiement automatique, mais le fichier est bien sur GitHub).');
            return;
        }

        setStatusDetail(`Workflow #${run.id} détecté. En cours d'exécution...`);

        // 3. Poll for completion
        const finalStatus = await import('../../services/githubService').then(m => m.waitForWorkflowCompletion(
            run.id,
            connectConfig,
            (s) => setStatusDetail(`Status GitHub : ${s}`)
        ));

        if (finalStatus === 'success') {
            setStatus('success');
            setMessage('Déploiement terminé avec succès ! Votre nouvelle version est en ligne.');
            if (onDeploySuccess && result.sha) {
                onDeploySuccess(result.sha, token);
            }
        } else if (finalStatus === 'failure') {
            setStatus('error');
            setMessage('Le fichier a été mis à jour, mais le déploiement GitHub Pages a échoué. Vérifiez l\'onglet "Actions" sur GitHub.');
        } else {
            setStatus('error');
            setMessage('Délai d\'attente dépassé pour le déploiement.');
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
                    {status !== 'success' && status !== 'building' && (
                        <button
                            onClick={handleDeploy}
                            disabled={status === 'loading'}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Publier
                        </button>
                    )}

                    {status === 'building' && (
                        <button
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded font-bold text-sm transition-colors disabled:opacity-90"
                        >
                            <Loader2 size={16} className="animate-spin" />
                            Déploiement en cours...
                        </button>
                    )}
                </div>

            </div>
        </div >
    );
};

export default DeployToGithubModal;
