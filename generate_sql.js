const fs = require('fs');
// Path to the file containing the previous SQL output with the JSON data
const inputPath = 'C:/Users/raist/.gemini/antigravity/brain/c0af7de1-a836-4eea-af5f-387c36dc9825/.system_generated/steps/381/output.txt';

try {
    const content = fs.readFileSync(inputPath, 'utf8');

    // Extract JSON from the specific format <untrusted-data...>
    // The previous output showed the data wrapped in a specific tag
    const match = content.match(/<untrusted-data-[^>]+>\s*(\[[^]*?\])\s*<\/untrusted-data-/);

    if (!match) {
        throw new Error('Could not find JSON data in the input file');
    }

    const dataArray = JSON.parse(match[1]);

    if (!dataArray || dataArray.length === 0) {
        throw new Error('JSON array is empty');
    }

    // Clone the data object
    const originalCharacter = dataArray[0];
    const characterData = JSON.parse(JSON.stringify(originalCharacter.data));

    // Modify the fields as requested
    characterData.header.name = 'Ayame2';
    characterData.header.player = 'Polo';

    // Remove the ID if it exists in the data blob to avoid confusion, 
    // though usually the ID is the primary key of the row, not inside the jsonb.
    // But checking just in case.
    if (characterData.id) delete characterData.id;

    // Prepare the SQL statement
    // We use a parameterized-like approach for the JSON string to ensure it's valid SQL
    // Escaping single quotes in the JSON string by doubling them
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
