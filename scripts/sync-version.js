
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const paths = {
    package: path.join(rootDir, 'package.json'),
    version: path.join(rootDir, 'public', 'version.json'),
    constants: path.join(rootDir, 'src', 'constants', 'app.ts')
};

// Lecture de la version dans package.json
const pkg = JSON.parse(fs.readFileSync(paths.package, 'utf8'));
const currentVersion = pkg.version;

console.log(`🚀 Synchronisation de la version : ${currentVersion}`);

// 1. Mise à jour de public/version.json
if (fs.existsSync(paths.version)) {
    const versionJson = JSON.parse(fs.readFileSync(paths.version, 'utf8'));
    versionJson.version = currentVersion;
    fs.writeFileSync(paths.version, JSON.stringify(versionJson, null, 2) + '\n');
    console.log('✅ public/version.json mis à jour.');
}

// 2. Mise à jour de src/constants/app.ts
if (fs.existsSync(paths.constants)) {
    let content = fs.readFileSync(paths.constants, 'utf8');
    content = content.replace(/export const APP_VERSION = ['"][^'"]+['"];/, `export const APP_VERSION = '${currentVersion}';`);
    fs.writeFileSync(paths.constants, content);
    console.log('✅ src/constants/app.ts mis à jour.');
}

// 3. Rotation automatique du changelog
console.log('🔄 Rotation du journal des modifications...');
import('./manage-changelog.js').catch(err => {
    console.error('⚠️ Erreur lors de la rotation du journal :', err);
});

console.log('🎉 Tous les fichiers sont synchronisés !');
