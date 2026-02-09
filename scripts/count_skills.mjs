
import { readFileSync } from 'fs';

const charPath = 'C:\\Users\\raist\\.gemini\\antigravity\\brain\\90ea714d-8113-4768-90b8-231bf71b72e4\\.system_generated\\steps\\260\\output.txt';
const content = readFileSync(charPath, 'utf8');

// The output is a string within a JSON-like structure of the tool response
// But wait, view_file returns the actual content. 
// Let's just parse the content directly if it's already the JSON string.
let data;
try {
    // If view_file returned the raw untrusted-data content, it might be just that.
    // Based on the output, it seems to be a description + untrusted data.
    const match = content.match(/<untrusted-data-.*?>\s*([\s\S]*?)\s*<\/untrusted-data-.*?>/);
    if (match) {
        data = JSON.parse(match[1]);
    } else {
        data = JSON.parse(content);
    }
} catch (e) {
    console.error("Failed to parse JSON:", e.message);
    process.exit(1);
}

const ayame = data.find(c => c.character_name === 'Ayame');
if (ayame) {
    const skills = ayame.char_skills;
    let total = 0;
    Object.keys(skills).forEach(cat => {
        if (Array.isArray(skills[cat])) {
            const count = skills[cat].filter(s => s && s.name && s.name.trim() !== "").length;
            console.log(`Category ${cat}: ${count} skills`);
            total += count;
        }
    });
    console.log(`Total non-empty skills for Ayame: ${total}`);

    // Check specific skills
    const col9 = skills.Col_Comp_9 || [];
    console.log("Col_Comp_9 skills:", col9.map(s => s.name).join(", "));
} else {
    console.log("Ayame not found");
}
