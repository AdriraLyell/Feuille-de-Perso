const fs = require('fs');
const crypto = require('crypto');

const inputPath = 'C:/Users/raist/.gemini/antigravity/brain/c0af7de1-a836-4eea-af5f-387c36dc9825/.system_generated/steps/381/output.txt';
const outputPath = 'd:/Projet JdR/feuille-de-perso/chunked_insert.sql';

try {
    let content = fs.readFileSync(inputPath, 'utf8');

    // Handle stringified JSON case
    if (content.trim().startsWith('"') && content.trim().endsWith('"')) {
        try { content = JSON.parse(content); } catch (e) { }
    }

    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');
    if (start === -1) throw new Error('No JSON array found');

    const jsonText = content.substring(start, end + 1);
    const dataArray = JSON.parse(jsonText);
    const charData = dataArray[0].data;

    // Updates
    charData.header.name = 'Ayame2';
    charData.header.player = 'Polo';
    if (charData.id) delete charData.id;

    const newId = crypto.randomUUID();
    const settingId = 'fe8f4a44-abbe-49f9-bbe1-95c9b60f3099';

    // 1. Initial Insert
    const initialSql = `INSERT INTO characters (id, character_name, player_name, setting_id, data) VALUES ('${newId}', 'Ayame2', 'Polo', '${settingId}', '{}'::jsonb);\n`;
    fs.writeFileSync(outputPath, `-- Character ID: ${newId}\n` + initialSql);

    // 2. Recursively chunk updates
    function emitUpdate(path, val) {
        const pathStr = "ARRAY[" + path.map(p => `'${p.replace(/'/g, "''")}'`).join(',') + "]";
        const valStr = JSON.stringify(val).replace(/'/g, "''");

        const sql = `UPDATE characters SET data = jsonb_set(data, ${pathStr}, '${valStr}'::jsonb) WHERE id = '${newId}';\n`;
        fs.appendFileSync(outputPath, sql);
    }

    function processChunk(path, obj) {
        const str = JSON.stringify(obj);
        // Threshold 3000 chars
        if (str.length < 3000) {
            emitUpdate(path, obj);
            return;
        }

        // If it's a large object, split it
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            // Create container first
            if (path.length > 0) {
                emitUpdate(path, {});
            }

            for (const key of Object.keys(obj)) {
                processChunk([...path, key], obj[key]);
            }
        } else {
            emitUpdate(path, obj);
        }
    }

    // Process top level keys
    // Since data is {}, we don't emit update for [] (data itself)
    // We emit updates for each key
    for (const key of Object.keys(charData)) {
        processChunk([key], charData[key]);
    }

    console.log(`Generated SQL at ${outputPath}`);
    console.log(`Character ID: ${newId}`);

} catch (err) {
    console.error(err);
    process.exit(1);
}
