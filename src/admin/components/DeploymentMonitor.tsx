import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Github } from 'lucide-react';
import { getLatestWorkflowRun } from '../../services/githubService';

const POLL_INTERVAL = 5000; // 5 seconds as requested

interface DeploymentMonitorProps {
    open: boolean; // Managed by parent or self? Let's make it self-managed mostly.
}

const DeploymentMonitor: React.FC = () => {
    const [lastRunId, setLastRunId] = useState<number | null>(null);
    const [currentRun, setCurrentRun] = useState<any | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Store credentials in ref to avoid dependency loops, assuming they don't change often during session
    const credsRef = useRef({
        token: localStorage.getItem('GITHUB_TOKEN'),
        owner: localStorage.getItem('GITHUB_OWNER'),
        repo: localStorage.getItem('GITHUB_REPO'),
        branch: 'main' // default
    });

    useEffect(() => {
        // Initial fetch to set the baseline (don't notify for old runs)
        const init = async () => {
            if (!credsRef.current.token) return;
            const run = await getLatestWorkflowRun(credsRef.current as any);
            if (run) {
                setLastRunId(run.id);
            }
        };
        init();

        const interval = setInterval(async () => {
            const { token, owner, repo } = credsRef.current;
            if (!token || !owner || !repo) return;

            const run = await getLatestWorkflowRun({ token, owner, repo, branch: 'main' });

            if (!run) return;

            setLastRunId(prev => {
                // CASE 1: New Deployment Detected
                if (prev && run.id > prev) {
                    playSound('start');
                    setNotification({ type: 'info', message: 'Nouveau déploiement détecté...' });
                    setIsVisible(true);
                    return run.id;
                }
                // CASE 2: Initialize if null
                if (prev === null) return run.id;

                return prev;
            });

            // Update current run status if it's the one we are tracking (or just the latest)
            setCurrentRun(prev => {
                if (prev && prev.id === run.id) {
                    // Detect Status Change
                    if (prev.status !== run.status || prev.conclusion !== run.conclusion) {
                        if (run.status === 'completed' && run.conclusion === 'success') {
                            playSound('success');
                            setNotification({ type: 'success', message: 'Nouvelle version en ligne !' });
                            setTimeout(() => setIsVisible(false), 10000); // Hide after 10s
                        } else if (run.status === 'completed' && run.conclusion === 'failure') {
                            playSound('error');
                            setNotification({ type: 'error', message: `Échec du build GitHub (Run #${run.id}). Vérifiez les logs.` });
                        }
                    }
                }
                return run;
            });

            // If running, keep visible
            if (run.status !== 'completed') {
                setIsVisible(true);
            }

        }, POLL_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    const playSound = (type: 'start' | 'success' | 'error') => {
        // Optional: Add simple beep or notification sound if desired
    };

    if (!isVisible && !notification) return null;

    // determine icon and color based on current run status
    const getStatusUI = () => {
        if (notification) {
            if (notification.type === 'success') return { icon: <CheckCircle className="text-green-500" />, color: 'border-green-500 bg-green-50' };
            if (notification.type === 'error') return { icon: <XCircle className="text-red-500" />, color: 'border-red-500 bg-red-50' };
            return { icon: <Github className="text-blue-500" />, color: 'border-blue-500 bg-blue-50' };
        }

        if (currentRun?.status === 'in_progress' || currentRun?.status === 'queued') {
            return { icon: <Loader2 className="animate-spin text-amber-600" />, color: 'border-amber-500 bg-amber-50' };
        }
        return { icon: <Github />, color: 'bg-white' };
    };

    const ui = getStatusUI();

    return (
        <div className={`fixed bottom-4 left-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 ${ui.color} animate-in slide-in-from-bottom-5 duration-300`}>
            {ui.icon}
            <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-800">
                    {notification ? notification.message : "Déploiement en cours..."}
                </span>
                {!notification && currentRun && (
                    <span className="text-xs text-slate-500">
                        Workflow #{currentRun.id} • {currentRun.status}
                    </span>
                )}
            </div>
            <button onClick={() => { setIsVisible(false); setNotification(null); }} className="ml-2 text-slate-400 hover:text-slate-600">
                ✕
            </button>
        </div>
    );
};

export default DeploymentMonitor;
