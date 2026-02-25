# Script de lancement Turbo pour Aider + LM Studio
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    $RemainingArgs
)

try {
    # 1. Détection du modèle
    $response = Invoke-RestMethod -Uri "http://localhost:1234/v1/models" -ErrorAction Stop
    $modelId = $response.data[0].id

    if (-not $modelId) {
        Write-Host "⚠️ Aucun modèle chargé dans LM Studio !" -ForegroundColor Yellow
        exit
    }

    Write-Host "🚀 Mode Turbo - Modèle : $modelId" -ForegroundColor Cyan
    
    # 2. Gestion intelligente du contexte
    $contextFiles = @("--read", ".agent/rules/AIDER_GUIDE.md")
    
    # Analyse de l'argument (le chemin du fichier) pour injecter le bon contexte
    foreach ($arg in $RemainingArgs) {
        if ($arg -match "src/utils/calculations") {
            $contextFiles += "--read", ".context/calculations.md"
            Write-Host "🧠 Contexte 'Calculs' injecté" -ForegroundColor DarkGray
        }
        elseif ($arg -match "src/components") {
            $contextFiles += "--read", ".context/ui_standards.md"
            Write-Host "🎨 Contexte 'UI' injecté" -ForegroundColor DarkGray
        }
    }

    # 3. Lancement avec expertise injectée et vitesse optimisée
    # --map-tokens 0 : Accélère le démarrage
    & aider --model "openai/$modelId" $contextFiles --map-tokens 0 $RemainingArgs
}
catch {
    Write-Host "❌ Erreur : LM Studio inaccessible." -ForegroundColor Red
}
