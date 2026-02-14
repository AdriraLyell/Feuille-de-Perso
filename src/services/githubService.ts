import { logger } from '../utils/logger';
import { GithubRateLimiter } from '../utils/githubUtils';

export interface GitHubConnectConfig {
    token: string;
    owner: string;
    repo: string;
    branch: string;
}

export interface PublishResult {
    success: boolean;
    sha?: string;
    message?: string;
}

export interface WorkflowRun {
    id: number;
    status: string;
    conclusion: string | null;
    html_url?: string;
    created_at?: string;
    updated_at?: string;
}

// Rate limit handled by GithubRateLimiter utility

/**
 * Checks if a file exists on GitHub and returns its SHA.
 */
export async function getFileSha(
    filePath: string,
    config: GitHubConnectConfig
): Promise<string | null> {
    if (GithubRateLimiter.isLimited()) return null;
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`;

    try {
        const res = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            return data.sha;
        }
        return null;
    } catch (error) {
        logger.warn('GitHub Service: Check file failed', error);
        return null;
    }
}

/**
 * Pushes a file to GitHub (Create or Update).
 * Handles Base64 encoding internally.
 */
export async function publishFileToGitHub(
    filePath: string,
    content: string,
    message: string,
    config: GitHubConnectConfig
): Promise<PublishResult> {
    if (GithubRateLimiter.isLimited()) return { success: false, message: "Limite de requêtes GitHub atteinte (Session)." };
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`;

    try {
        // 1. Get existing SHA (for update)
        const sha = await getFileSha(filePath, config);

        // 2. Prepare content (Base64 + UTF-8 support)
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        // 3. Push
        const res = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                content: base64Content,
                branch: config.branch,
                sha: sha || undefined
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Erreur inconnue GitHub');
        }

        const successData = await res.json();
        return {
            success: true,
            sha: successData.content?.sha
        };

    } catch (error) {
        return {
            success: false,
            message: (error as Error).message
        };
    }
}

/**
 * Fetches the latest workflow run for a repository branch.
 */
export async function getLatestWorkflowRun(
    config: GitHubConnectConfig
): Promise<WorkflowRun | null> {
    if (GithubRateLimiter.isLimited()) return null;
    // List runs for the branch, event=push is likely what we want, but just latest is safer
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs?branch=${config.branch}&per_page=1`;

    try {
        const res = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            return data.workflow_runs?.[0] || null;
        }
        return null;
    } catch (error) {
        logger.warn('GitHub Service: Get workflow failed', error);
        return null;
    }
}

/**
 * Polls a workflow run until it completes or times out.
 */
export async function waitForWorkflowCompletion(
    runId: number,
    config: GitHubConnectConfig,
    onStatusChange?: (status: string) => void
): Promise<'success' | 'failure' | 'timeout'> {
    const MAX_RETRIES = 60; // 60 * 5s = 5 minutes timeout
    const POLL_INTERVAL = 5000;

    for (let i = 0; i < MAX_RETRIES; i++) {
        const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs/${runId}`;

        try {
            const res = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (res.ok) {
                const run = await res.json();

                if (onStatusChange) {
                    onStatusChange(run.status);
                }

                if (run.status === 'completed') {
                    if (run.conclusion === 'success') return 'success';
                    return 'failure';
                }
            }
        } catch (error) {
            logger.warn('Polling error:', error);
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }

    return 'timeout';
}
