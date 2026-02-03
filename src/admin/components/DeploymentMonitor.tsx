import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { REPO_OWNER, REPO_NAME } from '../../constants';

interface DeploymentMonitorProps {
    token: string;
    commitSha: string | null;
    onComplete?: (success: boolean) => void;
    onDismiss: () => void;
}

type WorkflowStatus = 'queued' | 'in_progress' | 'completed' | 'unknown';
type WorkflowConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | null;

const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({ token, commitSha, onComplete, onDismiss }) => {
    const [status, setStatus] = useState<WorkflowStatus>('unknown');
    const [conclusion, setConclusion] = useState<WorkflowConclusion>(null);
    const [runUrl, setRunUrl] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    useEffect(() => {
        if (!commitSha || !token) return;

        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const checkStatus = async () => {
            try {
                // Fetch runs triggered by this commit
                const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?head_sha=${commitSha}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data.workflow_runs && data.workflow_runs.length > 0) {
                        const run = data.workflow_runs[0]; // Take the most recent one for this SHA
                        setRunUrl(run.html_url);
                        setStatus(run.status);
                        setConclusion(run.conclusion);

                        if (run.status === 'completed') {
                            if (onComplete) onComplete(run.conclusion === 'success');
                            clearInterval(intervalId); // Stop polling
                        }
                    } else {
                        // Maybe queued but not yet created? Keep polling
                        setStatus('queued');
                    }
                }
            } catch (error) {
                console.error("Monitor error:", error);
            }
        };

        // Initial Check
        checkStatus();

        // Poll every 5 seconds
        intervalId = setInterval(() => {
            if (isMounted) {
                setPollCount(prev => prev + 1);
                checkStatus();
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [commitSha, token]);

    if (!commitSha) return null;

    // Render Logic
    let content;
    let bgColor = "bg-slate-800";
    let textColor = "text-white";

    if (status === 'completed') {
        if (conclusion === 'success') {
            bgColor = "bg-green-600";
            content = (
                <>
                    <CheckCircle size={16} className="animate-in zoom-in" />
                    <span className="font-bold text-sm">Déploiement Terminé ! (v2.12.53)</span>
                </>
            );
        } else {
            bgColor = "bg-red-600";
            content = (
                <>
                    <XCircle size={16} />
                    <span className="font-bold text-sm">Échec du Déploiement</span>
                </>
            );
        }
    } else {
        // Queued or In Progress
        content = (
            <>
                <Loader2 size={16} className="animate-spin" />
                <span className="font-bold text-sm">
                    {status === 'queued' ? 'Mise en file d\'attente...' : 'Construction en cours...'}
                </span>
            </>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-4 px-4 py-3 rounded-lg shadow-xl ${bgColor} ${textColor} transition-all duration-500 animate-in slide-in-from-bottom-5`}>
            <div className="flex items-center gap-3">
                {content}
                {runUrl && (
                    <a href={runUrl} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity p-1" title="Voir les logs GitHub">
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>

            <button onClick={onDismiss} className="opacity-50 hover:opacity-100 ml-2 border-l border-white/20 pl-3">
                ✕
            </button>
        </div>
    );
};

export default DeploymentMonitor;
