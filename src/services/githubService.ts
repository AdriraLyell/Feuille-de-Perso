
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

/**
 * Checks if a file exists on GitHub and returns its SHA.
 */
export async function getFileSha(
    filePath: string,
    config: GitHubConnectConfig
): Promise<string | null> {
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
        console.warn('GitHub Service: Check file failed', error);
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
