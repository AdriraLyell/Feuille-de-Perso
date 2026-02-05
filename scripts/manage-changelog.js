
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const paths = {
    changelog: path.join(rootDir, 'src', 'data', 'changelog.json'),
    archive: path.join(rootDir, 'src', 'data', 'changelog_archive.json'),
    markdown: path.join(rootDir, 'CHANGELOG.md')
};

const MAIN_LIMIT = 20;
const ARCHIVE_LIMIT = 100;

function convertToMarkdown(entries) {
    return entries.map(entry => {
        const dateStr = entry.date || 'Date inconnue';
        const typeStr = entry.type ? ` [${entry.type.toUpperCase()}]` : '';
        let md = `## [${entry.version}] - ${dateStr}${typeStr}\n\n`;
        if (entry.changes && Array.isArray(entry.changes)) {
            md += entry.changes.map(change => `- ${change}`).join('\n');
        }
        return md;
    }).join('\n\n');
}

function manageChangelog() {
    if (!fs.existsSync(paths.changelog)) {
        console.error('❌ Le fichier changelog.json est introuvable.');
        return;
    }

    const fullChangelog = JSON.parse(fs.readFileSync(paths.changelog, 'utf8'));
    console.log(`📊 Total des entrées trouvées : ${fullChangelog.length}`);

    if (fullChangelog.length <= MAIN_LIMIT) {
        console.log('✅ Le journal est déjà sous la limite. Aucune action requise.');
        return;
    }

    // 1. Separation
    const mainEntries = fullChangelog.slice(0, MAIN_LIMIT);
    const overflowArchive = fullChangelog.slice(MAIN_LIMIT);

    // 2. Gestion de l'archive JSON
    let existingArchive = [];
    if (fs.existsSync(paths.archive)) {
        existingArchive = JSON.parse(fs.readFileSync(paths.archive, 'utf8'));
    }

    // On combine l'overflow du main avec l'archive existante
    const combinedArchive = [...overflowArchive, ...existingArchive];

    // On sépare ce qui doit aller en Markdown (ce qui dépasse ARCHIVE_LIMIT)
    const finalArchiveEntries = combinedArchive.slice(0, ARCHIVE_LIMIT);
    const overflowMarkdown = combinedArchive.slice(ARCHIVE_LIMIT);

    // 3. Écriture du JSON main
    fs.writeFileSync(paths.changelog, JSON.stringify(mainEntries, null, 4) + '\n');
    console.log(`✅ ${paths.changelog} mis à jour (${mainEntries.length} entrées).`);

    // 4. Écriture de l'archive JSON
    fs.writeFileSync(paths.archive, JSON.stringify(finalArchiveEntries, null, 4) + '\n');
    console.log(`✅ ${paths.archive} mis à jour (${finalArchiveEntries.length} entrées).`);

    // 5. Écriture du Markdown (Legacy)
    if (overflowMarkdown.length > 0) {
        let mdContent = '# Historique Ancien (Legacy Changelog)\n\n';
        if (fs.existsSync(paths.markdown)) {
            // Si le fichier existe déjà, on pourrait vouloir ajouter à la fin ou au début. 
            // Ici on va recréer ou ajouter intelligemment.
            // Pour faire simple et propre, on va garder le header et ajouter les nouvelles entrées legacy au début du markdown.
            const existingMd = fs.readFileSync(paths.markdown, 'utf8');
            const contentWithoutHeader = existingMd.replace('# Historique Ancien (Legacy Changelog)\n\n', '');
            mdContent += convertToMarkdown(overflowMarkdown) + '\n\n' + contentWithoutHeader;
        } else {
            mdContent += convertToMarkdown(overflowMarkdown);
        }
        fs.writeFileSync(paths.markdown, mdContent.trim() + '\n');
        console.log(`✅ ${paths.markdown} mis à jour (+${overflowMarkdown.length} entrées legacy).`);
    }

    console.log('🎉 Rotation du journal terminée avec succès !');
}

manageChangelog();
