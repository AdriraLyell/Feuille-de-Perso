#!/usr/bin/env node
/**
 * lmstudio-benchmark.mjs
 * Script automatisé pour tester et optimiser les paramètres d'inférence de différents modèles
 * via l'API native LM Studio.
 */

import { request as httpRequest } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234";
const API_KEY = process.env.LMSTUDIO_API_KEY ?? "sk-lm-AOyLYOXI:2OxjrchUPpk9EEBZkRQF";

// --- Configuration Benchmark ---
const MODELS_TO_TEST = [
    "qwen/qwen3-coder-next",     // 80B
    "qwen/qwen3-coder-30b",      // 30B 
    "mistralai/devstral-small-2-2512",      // Devstral 
];

const PARAM_VARIATIONS = [
    { name: "Default Ref", temperature: 0.2, top_p: 0.9, top_k: 40, ctx: 32768, batch: 2048 },
    { name: "Low Temp", temperature: 0.05, top_p: 0.8, top_k: 20, ctx: 32768, batch: 2048 },
    { name: "Fast Batch", temperature: 0.2, top_p: 0.9, top_k: 40, ctx: 16384, batch: 4096 }, // Moins de ctx gagne en tok/s
];

const TEST_PROMPTS = [
    {
        name: "Logique pure",
        system: "Tu es un expert en logique. Réponds brièvement.",
        input: "Si 5 machines prennent 5 minutes pour fabriquer 5 widgets, combien de temps prendraient 100 machines pour fabriquer 100 widgets ?"
    },
    {
        name: "Tool call (Filesystem)",
        system: "Tu es un assistant de programmation.",
        input: "Utilise ton outil mcp/filesystem pour lister les fichiers dans D:\\Projet JdR\\feuille-de-perso\\src\\components."
    }
];

// --- Helpers HTTP ---
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
                timeout: 300000 // 5m
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        if (res.statusCode >= 400 && res.statusCode !== 404) {
                            reject(new Error(`API Error ${res.statusCode}: ${data}`));
                        } else {
                            resolve(data ? JSON.parse(data) : null);
                        }
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message} - ${data}`));
                    }
                });
            }
        );
        req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
        req.on("error", reject);
        if (bodyData) req.write(bodyData);
        req.end();
    });
}

async function loadModel(modelKey, ctx, batch) {
    console.log(`\n> Loading ${modelKey} (ctx: ${ctx}, batch: ${batch})...`);
    const loadUrl = new URL("/api/v1/models/load", BASE_URL);
    try {
        const res = await fetchJson(loadUrl, "POST", {
            model: modelKey,
            context_length: ctx,
            eval_batch_size: batch,
            flash_attention: true,
            offload_kv_cache_to_gpu: true
        });
        console.log(`  -> Loaded. Load time: ${res.load_time_seconds}s`);
        return res.instance_id;
    } catch (err) {
        console.log(`  -> Failed to load: ${err.message}`);
        return null;
    }
}

async function unloadModel(instanceId) {
    const unloadUrl = new URL("/api/v1/models/unload", BASE_URL);
    await fetchJson(unloadUrl, "POST", { instance_id: instanceId });
    console.log(`  -> Unloaded ${instanceId}`);
}

async function listModels() {
    const listUrl = new URL("/api/v1/models", BASE_URL);
    const res = await fetchJson(listUrl, "GET");
    return res.models || [];
}

async function ensureEmptyMemory() {
    const models = await listModels();
    for (const m of models) {
        for (const instance of (m.loaded_instances || [])) {
            await unloadModel(instance.id);
        }
    }
}

async function runTest(instanceId, promptDef, paramsDef) {
    console.log(`    Testing prompt: '${promptDef.name}' with params: '${paramsDef.name}'...`);

    const startTime = Date.now();
    const url = new URL("/api/v1/chat", BASE_URL);
    const body = {
        model: instanceId,
        input: promptDef.input,
        system_prompt: promptDef.system,
        integrations: ["mcp/filesystem"],
        temperature: paramsDef.temperature,
        top_p: paramsDef.top_p,
        top_k: paramsDef.top_k,
        context_length: paramsDef.ctx, // Strict enforcement
        max_output_tokens: 1024,
        repeat_penalty: 1.1,
        store: false,
    };

    try {
        const res = await fetchJson(url, "POST", body);
        const duration = (Date.now() - startTime) / 1000;

        let usesTool = false;
        let answer = "";
        for (const out of res.output || []) {
            if (out.type === "tool_call") usesTool = true;
            if (out.type === "message") answer += out.content + " ";
        }

        const stats = res.stats || {};
        return {
            success: true,
            duration: duration.toFixed(1),
            inTokens: stats.input_tokens || 0,
            outTokens: stats.total_output_tokens || 0,
            speed: stats.tokens_per_second?.toFixed(2) || 0,
            usesTool,
            preview: answer.substring(0, 60).replace(/\n/g, " ") + "..."
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// --- Main execution ---
async function runBenchmark() {
    console.log("=== LM Studio Params Benchmark ===");
    console.log(`Testing Models: ${MODELS_TO_TEST.join(', ')}`);
    console.log("==================================\n");

    await ensureEmptyMemory();

    const results = [];

    for (const model of MODELS_TO_TEST) {
        // Group variations by required context/batch since changing them requires reloading
        const modelList = await listModels();
        const available = modelList.find(m => m.key.includes(model.split('/')[1]));

        if (!available) {
            console.log(`[SKIP] Model ${model} is not downloaded in LM Studio.`);
            continue;
        }

        const variationsByCtx = {};
        for (const p of PARAM_VARIATIONS) {
            const key = `${p.ctx}-${p.batch}`;
            if (!variationsByCtx[key]) variationsByCtx[key] = [];
            variationsByCtx[key].push(p);
        }

        for (const [ctxBatch, paramsArr] of Object.entries(variationsByCtx)) {
            const [ctx, batch] = ctxBatch.split('-').map(Number);

            const instanceId = await loadModel(model, ctx, batch);
            if (!instanceId) continue; // skip if load failed

            for (const params of paramsArr) {
                for (const prompt of TEST_PROMPTS) {
                    const result = await runTest(instanceId, prompt, params);
                    results.push({
                        Model: model.split('/')[1],
                        Params: params.name,
                        Prompt: prompt.name,
                        TokSec: result.speed,
                        OutTok: result.outTokens,
                        Tool: result.usesTool ? "✅" : "❌",
                        Response: result.preview
                    });
                }
            }
            await unloadModel(instanceId);
        }
    }

    console.table(results);

    // Save to markdown
    let md = "# Benchmark Results\n\n| Model | Params | Prompt | Tok/s | OutTok | Tool | Preview |\n|---|---|---|---|---|---|---|\n";
    for (const r of results) {
        md += `| ${r.Model} | ${r.Params} | ${r.Prompt} | ${r.TokSec} | ${r.OutTok} | ${r.Tool} | ${r.Response} |\n`;
    }

    await fs.writeFile(path.join(process.cwd(), "scripts", "benchmark-results.md"), md, "utf8");
    console.log("\nResults saved to scripts/benchmark-results.md");
}

runBenchmark().catch(err => {
    console.error("Benchmark failed:", err);
    process.exit(1);
});
