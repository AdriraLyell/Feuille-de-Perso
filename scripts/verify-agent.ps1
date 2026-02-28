# Script de vérification post-agent

Write-Host "🕵️ Vérification du travail de l'agent..." -ForegroundColor Cyan

# 1. Vérification ESLint
Write-Host "--- LINT ---" -ForegroundColor Gray
npm run lint

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de Lint détectée !" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Vérification Build
Write-Host "--- BUILD ---" -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Le build a échoué ! L'agent a cassé quelque chose." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "✅ Tout est en ordre. Modifications validées." -ForegroundColor Green
