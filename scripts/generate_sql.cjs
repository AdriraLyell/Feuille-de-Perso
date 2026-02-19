const fs = require('fs');
const path = require('path');

// Hardcoded path to the previous output file
const inputPath = 'C:/Users/raist/.gemini/antigravity/brain/c0af7de1-a836-4eea-af5f-387c36dc9825/.system_generated/steps/381/output.txt';

try {
    let content = fs.readFileSync(inputPath, 'utf8');

    // If the content is a JSON string (starts and ends with "), parse it first to unescape
    if (content.trim().startsWith('"') && content.trim().endsWith('"')) {
        try {
            content = JSON.parse(content);
        } catch (e) {
            console.log("Failed to parse outer JSON string, using raw content");
        }
    }

    // Find the start of the JSON array
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');

    if (start === -1 || end === -1 || end < start) {
        throw new Error('Could not find JSON array brackets in the input file');
    }

    const jsonText = content.substring(start, end + 1);
    const dataArray = JSON.parse(jsonText);

    if (!dataArray || dataArray.length === 0) {
        throw new Error('JSON array is empty');
    }

    // Get the first character object
    const characterData = dataArray[0].data;

    // Modify the fields
    characterData.header.name = 'Ayame2';
    characterData.header.player = 'Polo';

    // Remove the ID if it exists at the root of the data blob (usually not, but good practice)
    if (characterData.id) delete characterData.id;

    // Stringify and escape for SQL
    const jsonString = JSON.stringify(characterData).replace(/'/g, "''");

    const sql = `INSERT INTO characters (character_name, player_name, setting_id, data) 
VALUES (
    'Ayame2', 
    'Polo', 
    'fe8f4a44-abbe-49f9-bbe1-95c9b60f3099', 
    '${jsonString}'::jsonb
);`;

    fs.writeFileSync('insert_ayame2.sql', sql);
    console.log('Successfully generated insert_ayame2.sql');

} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
