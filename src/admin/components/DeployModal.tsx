import React, { useState } from 'react';
import { generateRulesJSONContent } from '../utils/rulesGenerator';
import { publishFileToGitHub } from '../../services/githubService';
import { RulesData } from '../../types/rules';
import { Save, AlertTriangle, CheckCircle, Loader2, GitBranch, X, Info } from 'lucide-react';
import { APP_VERSION } from '../../constants/app';
import { logger } from '../../utils/logger';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';

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
    const filePath = 'public/data/rules.json';
    const branch = 'main';

    const [status, setStatus] = useState<'idle' | 'loading' | 'building' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const [statusDetail, setStatusDetail] = useState<string>('');

    const saveCredentials = () => {
        localStorage.setItem('GITHUB_TOKEN', token);
        localStorage.setItem('GITHUB_OWNER', repoOwner);
        localStorage.setItem('GITHUB_REPO', repoName);
    };

    if (!isOpen) return null;

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
            // 1. Publish File (JSON)
            const content = generateRulesJSONContent(rules);
            const commitMessage = `🚀 push(rules): Sync v${rules.version} from Admin App`;

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
            setMessage('Données transmises. Initialisation du déploiement GitHub Pages...');

            // Wait a few seconds for GitHub to trigger the workflow
            await new Promise(r => setTimeout(r, 5000));

            const githubService = await import('../../services/githubService');
            let run = await githubService.getLatestWorkflowRun(connectConfig);

            let attempts = 0;
            while (attempts < 8) {
                const runDate = run?.created_at ? new Date(run.created_at).getTime() : 0;
                const now = Date.now();
                if (!run || (now - runDate > 120000)) {
                    await new Promise(r => setTimeout(r, 3000));
                    run = await githubService.getLatestWorkflowRun(connectConfig);
                    attempts++;
                } else {
                    break;
                }
            }

            if (!run) {
                setStatus('success');
                setMessage('Corpus mis à jour ! Le déploiement est en file d\'attente sur GitHub.');
                return;
            }

            setStatusDetail(`Workflow #${run.id} actif. Phase d'incrustation...`);

            const finalStatus = await githubService.waitForWorkflowCompletion(
                run.id,
                connectConfig,
                (s) => setStatusDetail(`Status GitHub : ${s}`)
            );

            if (finalStatus === 'success') {
                setStatus('success');
                setMessage('Déploiement terminé. Vos règles sont désormais la nouvelle vérité du monde.');
                if (onDeploySuccess && result.sha) {
                    onDeploySuccess(result.sha, token);
                }
            } else {
                setStatus('error');
                setMessage('Le fichier est à jour, mais le déploiement Pages a rencontré une anomalie.');
            }
        } catch (err) {
            logger.error('Erreur de déploiement:', err);
            setStatus('error');
            setMessage('Une erreur arcanique a interrompu le processus.');
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-950/80 z-[100] flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-300">
            <MotionFade className="w-full max-w-xl">
                <MotionCard className="bg-stone-900 border-l-4 border-amber-600 shadow-glass-heavy overflow-hidden" hoverEffect="none">
                    {/* Header */}
                    <div className="bg-mystic-deep/50 p-6 border-b border-stone-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-900/20 text-amber-500 rounded-sm border border-amber-900/30">
                                <GitBranch size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-black text-amber-500 uppercase tracking-widest leading-none">Transmission du Corpus</h2>
                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Synchronisation GitHub v{APP_VERSION}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-stone-600 hover:text-amber-500 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        <div className="bg-stone-950/50 border border-amber-900/20 rounded-sm p-4 text-[11px] text-amber-200/70 flex items-start gap-3 italic leading-relaxed">
                            <Info size={16} className="text-amber-600 shrink-0" />
                            <p>
                                Vous allez soumettre le fichier <span className="text-amber-500 font-bold font-mono">rules.json</span> sur votre dépôt.
                                Ce corpus deviendra la référence absolue pour tous les joueurs en ligne.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="repoOwner" className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Maître du Dépôt</label>
                                <input
                                    id="repoOwner"
                                    value={repoOwner}
                                    onChange={(e) => setRepoOwner(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-sm px-3 py-2 text-stone-300 focus:border-amber-500/50 outline-none text-xs transition-all"
                                    placeholder="ex: AdriraLyell"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="repoName" className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Archives (Dépôt)</label>
                                <input
                                    id="repoName"
                                    value={repoName}
                                    onChange={(e) => setRepoName(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-sm px-3 py-2 text-stone-300 focus:border-amber-500/50 outline-none text-xs transition-all"
                                    placeholder="ex: Feuille-de-Perso"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="githubToken" className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Sceau d'Accès (GitHub Token)</label>
                            <div className="relative">
                                <input
                                    id="githubToken"
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-sm px-3 py-2 text-stone-300 focus:border-amber-500/50 outline-none text-xs font-mono pr-10"
                                    placeholder="ghp_..."
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-700">
                                    <Save size={14} />
                                </div>
                            </div>
                            <p className="text-[9px] text-stone-600 font-medium">
                                Les informations sont conservées dans les strates de votre navigateur local.
                            </p>
                        </div>

                        {status === 'error' && (
                            <MotionFade className="bg-red-950/20 text-red-400 p-4 rounded-sm border border-red-900/30 flex items-center gap-3 text-xs font-bold">
                                <AlertTriangle size={18} className="shrink-0" />
                                <div>{message}</div>
                            </MotionFade>
                        )}

                        {status === 'success' && (
                            <MotionFade className="bg-green-950/20 text-green-400 p-4 rounded-sm border border-green-900/30 flex flex-col gap-3">
                                <div className="flex items-center gap-2 font-bold text-xs">
                                    <CheckCircle size={18} /> {message}
                                </div>
                                <a
                                    href={`https://github.com/${repoOwner}/${repoName}/blob/${branch}/${filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] uppercase font-black tracking-widest hover:text-green-300 transition-colors underline"
                                >
                                    Consulter les Archives GitHub →
                                </a>
                            </MotionFade>
                        )}

                        {(status === 'loading' || status === 'building') && (
                            <div className="space-y-3">
                                <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                                    <div className="h-full bg-gradient-to-r from-amber-900 via-amber-500 to-amber-900 w-1/3 animate-progress transition-all" />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-amber-600 animate-pulse">{message}</span>
                                    <span className="text-stone-500">{statusDetail}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-stone-950/30 p-6 flex justify-end gap-4 border-t border-stone-800">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-stone-500 hover:text-stone-300 font-black uppercase tracking-[0.2em] text-[10px] transition-colors"
                        >
                            Annuler
                        </button>
                        {status !== 'success' && status !== 'building' && (
                            <button
                                onClick={handleDeploy}
                                disabled={status === 'loading'}
                                className="flex items-center gap-2 px-8 py-2.5 bg-amber-600 text-stone-950 hover:bg-amber-500 rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-glow-gold disabled:opacity-50"
                            >
                                {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lancer la Synchro
                            </button>
                        )}
                        {status === 'building' && (
                            <div className="flex items-center gap-3 px-8 py-2.5 bg-stone-800 text-amber-500/50 rounded-sm font-black uppercase tracking-widest text-xs border border-amber-900/20 cursor-wait">
                                <Loader2 size={16} className="animate-spin" />
                                Phase d'Incrustation
                            </div>
                        )}
                    </div>
                </MotionCard>
            </MotionFade>
        </div>
    );
};

export default DeployToGithubModal;
