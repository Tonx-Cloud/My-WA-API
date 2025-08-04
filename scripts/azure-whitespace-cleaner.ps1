# 🧹 AZURE TRAILING WHITESPACE CLEANER
# PowerShell script para limpeza completa de trailing whitespace
# Baseado em Azure DevOps best practices

Write-Host "🚀 INICIANDO LIMPEZA DE TRAILING WHITESPACE" -ForegroundColor Green
Write-Host "🔧 Usando padrões Azure para CI/CD" -ForegroundColor Blue
Write-Host ""

$startTime = Get-Date
$processedFiles = 0
$cleanedFiles = 0
$errors = 0

# Padrões de arquivos para limpar (Azure best practice)
$filePatterns = @(
    "*.ts", "*.tsx", "*.js", "*.jsx",
    "*.md", "*.json", "*.yml", "*.yaml",
    "*.css", "*.scss", "*.html",
    "*.txt"
)

# Pastas para excluir (Azure best practice)
$excludePaths = @(
    "node_modules", ".git", "dist", "build", 
    "coverage", ".next", "logs", "data", "uploads"
)

foreach ($pattern in $filePatterns) {
    Write-Host "📂 Processando padrão: $pattern" -ForegroundColor Yellow
    
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse | Where-Object {
        $exclude = $false
        foreach ($excludePath in $excludePaths) {
            if ($_.FullName -like "*\$excludePath\*") {
                $exclude = $true
                break
            }
        }
        -not $exclude
    }
    
    Write-Host "📄 Encontrados $($files.Count) arquivos" -ForegroundColor Cyan
    
        foreach ($file in $files) {
            try {
                $content = Get-Content $file.FullName -Raw -ErrorAction Stop
                if ($content) {
                    # Remove trailing whitespace de cada linha
                    $lines = $content -split "`r?`n"
                    $cleanedLines = $lines | ForEach-Object { $_ -replace '\s+$', '' }
                    $cleanedContent = $cleanedLines -join "`n"
                    
                    if ($content -ne $cleanedContent) {
                        Set-Content -Path $file.FullName -Value $cleanedContent -NoNewline -ErrorAction Stop
                        Write-Host "Cleaned: $($file.FullName)" -ForegroundColor Green
                        $cleanedFiles++
                    }
                }
                $processedFiles++
            }
            catch {
                Write-Host "Error cleaning $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
                $errors++
            }
            
            # Progress indicator
            if ($processedFiles % 50 -eq 0) {
                Write-Host "Processados: $processedFiles arquivos..." -ForegroundColor DarkGray
            }
        }
    }

$duration = (Get-Date) - $startTime
$successRate = if ($processedFiles -gt 0) { [math]::Round(($processedFiles - $errors) / $processedFiles * 100, 1) } else { 100 }

Write-Host ""
Write-Host "📊 RELATÓRIO DE LIMPEZA" -ForegroundColor Magenta
Write-Host "====================================" -ForegroundColor Magenta
Write-Host "📄 Arquivos processados: $processedFiles" -ForegroundColor White
Write-Host "✅ Arquivos limpos: $cleanedFiles" -ForegroundColor Green
Write-Host "❌ Erros: $errors" -ForegroundColor Red
Write-Host "⏱️  Duração: $([math]::Round($duration.TotalSeconds, 2))s" -ForegroundColor White
Write-Host "🚀 Taxa de sucesso: $successRate%" -ForegroundColor White

if ($cleanedFiles -gt 0) {
    Write-Host ""
    Write-Host "🎉 TRAILING WHITESPACE ELIMINADO!" -ForegroundColor Green
    Write-Host "✅ Projeto pronto para Azure deployment" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✨ Nenhum trailing whitespace encontrado" -ForegroundColor Green
    Write-Host "✅ Projeto já está limpo" -ForegroundColor Green
}

Write-Host ""
Write-Host "Executando verificacao final com git..." -ForegroundColor Blue
$gitCheck = git diff --check 2>$null
if ($LASTEXITCODE -eq 0 -and -not $gitCheck) {
    Write-Host "Git diff --check: PASSOU" -ForegroundColor Green
} else {
    Write-Host "Git diff --check: Possiveis problemas restantes" -ForegroundColor Yellow
}
