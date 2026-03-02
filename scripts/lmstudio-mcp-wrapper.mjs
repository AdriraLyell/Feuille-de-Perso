#!/usr/bin/env node
/**
 * LM Studio MCP Wrapper
 * Exposes a `lmstudio_chat` tool via MCP (JSON-RPC over stdio).
 * Calls LM Studio's native /api/v1/chat endpoint with MCP integrations support.
 *
 * Config via env:
 *   LMSTUDIO_BASE_URL  — default: http://localhost:1234
 *   LMSTUDIO_API_KEY   — bearer token
 *   LMSTUDIO_MODEL     — model key, e.g. qwen/qwen3-coder-next
 */

import { createServer } from "node:http";
import { request as httpRequest } from "node:http";
import * as fs from "node:fs";
import { execSync } from "node:child_process";

const BASE_URL = process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234";
const API_KEY = process.env.LMSTUDIO_API_KEY ?? "";
const DEFAULT_MODEL = process.env.LMSTUDIO_MODEL ?? "qwen/qwen3-coder-30b";

// ─── MCP Protocol (JSON-RPC 2.0 over stdio) ────────────────────────────────

const SERVER_INFO = {
    name: "lmstudio-mcp-wrapper",
    version: "1.0.0",
};

const TOOLS = [
    {
        name: "lmstudio_chat",
        description:
            "Send a prompt to the local LM Studio model. The model has access to MCP tools (filesystem, etc.) configured in LM Studio. Returns the model's text response and any tool call results.",
        inputSchema: {
            type: "object",
            properties: {
                input: {
                    type: "string",
                    description: "The prompt or instruction to send to the model.",
                },
                system_prompt: {
                    type: "string",
                    description: "Optional system prompt to set model behavior.",
                },
                integrations: {
                    type: "array",
                    items: { type: "string" },
                    description:
                        'Optional list of LM Studio MCP integrations to enable, e.g. ["mcp/filesystem"]. Defaults to ["mcp/filesystem"].',
                },
                temperature: {
                    type: "number",
                    description: "Sampling temperature [0,1]. Default: 0.2.",
                },
                context_length: {
                    type: "integer",
                    description:
                        "Context window size. Default: 8192 (recommended for MCP).",
                },
                max_output_tokens: {
                    type: "integer",
                    description: "Max tokens to generate. Default: 4096.",
                },
            },
            required: ["input"],
        },
    },
];

// ─── LM Studio API Call ─────────────────────────────────────────────────────

let currentModelInstanceId = null;
let currentModelContextLength = 32768; // Default to the requested high context

/**
 * Helper to make HTTP JSON requests
 */
function fetchJson(url, method, bodyObj = null) {
    return new Promise((resolve, reject) => {
        let bodyData = null;
        const headers = { "Content-Type": "application/json" };
        if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

        if (bodyObj) {
            bodyData = JSON.stringify(bodyObj);
            headers["Content-Length"] = Buffer.byteLength(bodyData);
        }

        const req = httpRequest(
            {
                hostname: url.hostname,
                port: url.port || 1234,
                path: url.pathname + url.search,
                method,
                headers,
                timeout: 300000 // 5 minutes timeout for model loading
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`API Error ${res.statusCode}: ${data}`));
                    } else {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`Failed to parse response: ${data}`));
                        }
                    }
                });
            }
        );
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Request timed out (model loading took too long)"));
        });
        req.on("error", reject);
        if (bodyData) req.write(bodyData);
        req.end();
    });
}

/**
 * Checks if the model is busy or loading using the CLI.
 * Returns { status: string, queued: number }
 */
function getModelProcessStatus() {
    try {
        const stdout = execSync("lms ps --json", { encoding: "utf8" });
        const processes = JSON.parse(stdout);
        const proc = processes.find(p => p.modelKey === DEFAULT_MODEL || p.identifier === DEFAULT_MODEL);
        return proc ? { status: proc.status, queued: proc.queued || 0 } : null;
    } catch (e) {
        process.stderr.write(`[Wrapper] Failed to check status via CLI: ${e.message}\n`);
        return null;
    }
}

/**
 * Checks if the model is loaded, and loads it if it isn't or if config is sub-optimal.
 * @returns {Promise<void>}
 */
async function ensureModelLoaded() {
    const TARGET_CONFIG = {
        context_length: 32768,
        eval_batch_size: 2048,
        flash_attention: true,
        offload_kv_cache_to_gpu: true
    };

    let retries = 0;
    const maxRetries = 15; // 15 * 2s = 30s wait for busy model

    while (retries < maxRetries) {
        // 1. Check process status via CLI (busy/queued)
        const procStatus = getModelProcessStatus();
        if (procStatus && (procStatus.status === "loading" || procStatus.status === "busy" || procStatus.queued > 0)) {
            process.stderr.write(`[Wrapper] Model is ${procStatus.status} (queued: ${procStatus.queued}). Waiting 2s... (Retry ${retries + 1}/${maxRetries})\n`);
            await new Promise(r => setTimeout(r, 2000));
            retries++;
            continue;
        }

        // 2. Check currently loaded models and their config
        const listUrl = new URL("/api/v1/models", BASE_URL);
        const listRes = await fetchJson(listUrl, "GET");

        const modelDef = listRes?.models?.find((m) => m.key === DEFAULT_MODEL);
        const instance = modelDef?.loaded_instances?.[0];

        if (instance) {
            const cfg = instance.config;
            const isConfigValid =
                cfg.context_length >= TARGET_CONFIG.context_length &&
                cfg.flash_attention === TARGET_CONFIG.flash_attention &&
                cfg.offload_kv_cache_to_gpu === TARGET_CONFIG.offload_kv_cache_to_gpu;

            if (isConfigValid) {
                currentModelInstanceId = instance.id;
                currentModelContextLength = cfg.context_length;
                process.stderr.write(`[Wrapper] Using already loaded instance: ${currentModelInstanceId} (ctx: ${currentModelContextLength})\n`);
                return;
            } else {
                process.stderr.write(`[Wrapper] Instance found but sub-optimal config. Unloading for refresh...\n`);
                const unloadUrl = new URL("/api/v1/models/unload", BASE_URL);
                await fetchJson(unloadUrl, "POST", { identifier: instance.id });
                await new Promise(r => setTimeout(r, 1000));
                // Loop back to load it properly
                continue;
            }
        }

        // 3. Load the model with optimal parameters
        process.stderr.write(`[Wrapper] Loading ${DEFAULT_MODEL} with optimal settings...\n`);
        const loadUrl = new URL("/api/v1/models/load", BASE_URL);
        const loadRes = await fetchJson(loadUrl, "POST", {
            model: DEFAULT_MODEL,
            ...TARGET_CONFIG
        });

        if (loadRes?.instance_id) {
            currentModelInstanceId = loadRes.instance_id;
            currentModelContextLength = TARGET_CONFIG.context_length;
            process.stderr.write(`[Wrapper] Model loaded successfully: ${currentModelInstanceId}\n`);
            return;
        } else {
            throw new Error(`Failed to load model. Response: ${JSON.stringify(loadRes)}`);
        }
    }

    throw new Error(`Model remained busy/loading after ${maxRetries} retries. Request cancelled to prevent hang.`);
}

/**
 * @param {object} params
 * @returns {Promise<string>} — formatted text response
 */
async function callLMStudio(params) {
    await ensureModelLoaded();

    const {
        input,
        system_prompt,
        integrations = ["mcp/filesystem"],
        temperature = 0.2,
        max_output_tokens = 4096,
    } = params;

    // Use the context length from the loaded instance to prevent duplicates
    const context_length = params.context_length || currentModelContextLength;

    const body = {
        model: currentModelInstanceId || DEFAULT_MODEL,
        input,
        ...(system_prompt ? { system_prompt } : {}),
        integrations,
        temperature,
        context_length,
        max_output_tokens,
        repeat_penalty: 1.1,
        top_k: 40,
        top_p: 0.9,
        min_p: 0.05,
        store: false,
    };

    const url = new URL("/api/v1/chat", BASE_URL);
    const result = await fetchJson(url, "POST", body);
    return buildOutput(result);
}

/**
 * Format the LM Studio response output array into a readable string.
 * @param {object} json — parsed API response
 * @returns {string}
 */
function buildOutput(json) {
    const parts = [];
    for (const item of json.output ?? []) {
        if (item.type === "message") {
            parts.push(item.content);
        } else if (item.type === "tool_call") {
            parts.push(
                `[TOOL: ${item.tool}]\nArgs: ${JSON.stringify(item.arguments, null, 2)}\nResult: ${item.output}`
            );
        } else if (item.type === "reasoning") {
            // skip reasoning tokens silently
        } else if (item.type === "invalid_tool_call") {
            parts.push(`[INVALID TOOL CALL: ${item.tool_name}] ${item.reason}`);
        }
    }

    const stats = json.stats;
    if (stats) {
        parts.push(
            `\n---\nTokens: ${stats.input_tokens} in / ${stats.total_output_tokens} out | Speed: ${stats.tokens_per_second?.toFixed(1)} tok/s`
        );
    }

    return parts.join("\n\n");
}

// ─── JSON-RPC / MCP Handler ─────────────────────────────────────────────────

/**
 * @param {object} req — parsed JSON-RPC request
 * @returns {object} — JSON-RPC response
 */
async function handleRequest(req) {
    const { id, method, params } = req;

    const ok = (result) => ({ jsonrpc: "2.0", id, result });
    const err = (code, message, data) => ({
        jsonrpc: "2.0",
        id: id !== undefined ? id : null,
        error: { code, message, ...(data ? { data } : {}) },
    });

    // In JSON-RPC, a request without an id is a Notification.
    // The server MUST NOT reply to a Notification.
    if (id === undefined) {
        return null;
    }

    switch (method) {
        case "initialize":
            return ok({
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                serverInfo: SERVER_INFO,
            });

        case "initialized":
            return null; // notification, no response

        case "ping":
            return ok({});

        case "tools/list":
            return ok({ tools: TOOLS });

        case "tools/call": {
            const toolName = params?.name;
            const toolArgs = params?.arguments ?? {};

            if (toolName !== "lmstudio_chat") {
                return err(-32601, `Unknown tool: ${toolName}`);
            }

            if (!toolArgs.input || typeof toolArgs.input !== "string") {
                return err(-32602, `Missing required parameter: input`);
            }

            try {
                const text = await callLMStudio(toolArgs);
                return ok({
                    content: [{ type: "text", text }],
                });
            } catch (e) {
                return ok({
                    content: [{ type: "text", text: `Error: ${e.message}` }],
                    isError: true,
                });
            }
        }

        default:
            return err(-32601, `Method not found: ${method}`);
    }
}

// ─── Stdio Transport ─────────────────────────────────────────────────────────

let inputBuffer = "";
let pendingRequests = 0;
let stdinEnded = false;

function maybeExit() {
    if (stdinEnded && pendingRequests === 0) {
        process.exit(0);
    }
}

process.stdin.setEncoding("utf8");

process.stdin.on("data", async (chunk) => {
    inputBuffer += chunk;
    const lines = inputBuffer.split("\n");
    inputBuffer = lines.pop() ?? "";

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let req;
        try {
            req = JSON.parse(trimmed);
        } catch {
            // malformed input — ignore
            continue;
        }

        pendingRequests++;
        handleRequest(req).then((response) => {
            if (response !== null) {
                process.stdout.write(JSON.stringify(response) + "\n");
            }
            pendingRequests--;
            maybeExit();
        }).catch((e) => {
            process.stderr.write(`Handle error: ${e.message}\n`);
            pendingRequests--;
            maybeExit();
        });
    }
});

process.stdin.on("end", () => {
    stdinEnded = true;
    maybeExit();
});


// Suppress unhandled errors from crashing the wrapper
process.on("uncaughtException", (e) => {
    process.stderr.write(`Uncaught: ${e.message}\n`);
});
